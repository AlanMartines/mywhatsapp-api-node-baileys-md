//
// Configuração dos módulos
const os = require('os');
const {
  forEach
} = require('p-iteration');
const sleep = require('await-sleep');
const fs = require('fs-extra');
const path = require('path');
const express = require("express");
const multer = require('multer');
const upload = multer({});
const mime = require('mime-types');
const router = express.Router();
const Sessions = require("../sessions.js");
const verifyToken = require("../middleware/verifyToken");
//
// ------------------------------------------------------------------------------------------------//
//
async function deletaArquivosTemp(filePath) {
  //
  const cacheExists = await fs.pathExists(filePath);
  console.log('- O arquivo é: ' + cacheExists);
  if (cacheExists) {
    fs.remove(filePath);
    console.log('- O arquivo removido: ' + cacheExists);
  }
}
//
// ------------------------------------------------------------------------------------------------//
//
function soNumeros(string) {
  var numbers = string.replace(/[^0-9]/g, '');
  return numbers;
}
//
async function validatePhone(phone) {
  // A função abaixo demonstra o uso de uma expressão regular que identifica, de forma simples, telefones válidos no Brasil.
  // Nenhum DDD iniciado por 0 é aceito, e nenhum número de telefone pode iniciar com 0 ou 1.
  // Exemplos válidos: +55 (11) 98888-8888 / 9999-9999 / 21 98888-8888 / 5511988888888
  //
  var isValid = /^(?:(?:\+|00)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\d|[2-9])\d{3})\-?(\d{4}))$/;
  //var isValid = /^(?:(?:\+|00)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)(?:((?:9\d|[2-9])\d{3})\-?(\d{4}))$/;
  //var isValid = /^(?:(?#DDI)(?:\+|00)?(55)\s?)?(?:(?#DDD)\(?([1-9][0-9])\)?\s?)(?:(?#Telefone)((?:9\d|[2-9])\d{3})\-?(\d{4}))$/gm;
  //var isValid = /^(?:(?:+|00)?(55)\s?)?(?:(?([1-9][0-9]))?\s?)(?:((?:9\d|[2-9])\d{3})-?(\d{4}))$/;
  var result = await isValid.test(phone);
  return result;
}
//
// ------------------------------------------------------------------------------------------------//
//
String.prototype.toHHMMSS = function() {
  var sec_num = parseInt(this, 10); // não se esqueça do segundo parâmetro

  var hours = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);

  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds;
  }
  var time = hours + ':' + minutes + ':' + seconds;
  return time;
}
//
// ------------------------------------------------------------------------------------------------//
//
const convertBytes = function(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]

  if (bytes == 0) {
    return "n/a"
  }

  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))

  if (i == 0) {
    return bytes + " " + sizes[i]
  }

  return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
}
//
// ------------------------------------------------------------------------------------------------//
//
/*
╔═╗┌─┐┌┬┐┌┬┐┬┌┐┌┌─┐  ┌─┐┌┬┐┌─┐┬─┐┌┬┐┌─┐┌┬┐
║ ╦├┤  │  │ │││││ ┬  └─┐ │ ├─┤├┬┘ │ ├┤  ││
╚═╝└─┘ ┴  ┴ ┴┘└┘└─┘  └─┘ ┴ ┴ ┴┴└─ ┴ └─┘─┴┘
*/
router.post("/Start", upload.none(''), verifyToken.verify, async (req, res, next) => {
  //
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  var session = Sessions.getSession(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
    case 'qrRead':
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sessionStatus
      });
      break;
    case 'notLogged':
    case 'CLOSED':
    case 'DISCONNECTED':
      //
      var getStart = await Sessions.Start(req.body.SessionName.trim(), req.body.AuthorizationToken.trim());
      console.log("- AuthorizationToken:", req.body.AuthorizationToken.trim());
      session.state = 'STARTING';
      session.status = 'notLogged';
      //
      var Start = {
        result: "info",
        state: 'STARTING',
        status: 'notLogged',
        message: 'Sistema iniciando e indisponivel para uso'
      };
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": Start
      });
      //
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
  //
});
//
// ------------------------------------------------------------------------------------------------//
//
// Gera o QR-Code
router.post("/QRCode", upload.none(''), verifyToken.verify, async (req, res, next) => {
  console.log("- getQRCode");
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  var session = Sessions.getSession(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sessionStatus
      });
      break;
      //
    case 'notLogged':
    case 'qrRead':
      //
      if (req.body.View === true) {
        var xSession = session.qrcodedata;
        if (xSession) {
          const imageBuffer = Buffer.from(xSession, 'base64');
          //
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': imageBuffer.length
          });
          //
          res.status(200).end(imageBuffer);
          //
        } else {
          var getQRCode = {
            result: 'error',
            state: 'NOTFOUND',
            status: 'notLogged',
            message: 'Sistema Off-line'
          };
          //
          res.setHeader('Content-Type', 'application/json');
          res.status(200).json({
            "Status": getQRCode
          });
          //
        }
      } else {
        var getQRCode = {
          result: "success",
          state: session.state,
          status: session.status,
          qrcode: session.qrcode,
          message: "Aguardando leitura do QR-Code"
        };
        //
        res.setHeader('Content-Type', 'application/json');
        res.status(200).json({
          "Status": getQRCode
        });
        //
      }
      //
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
  //
});
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/getSessions", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var getSessions = await Sessions.getSessions();
  //
  //console.log(result);
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    "Status": getSessions
  });
}); //getSessions
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/Status", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var Status = await Sessions.ApiStatus(
    req.body.SessionName
  );
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    "Status": Status
  });

}); //Status
//
// ------------------------------------------------------------------------------------------------//
//
// Dados de memoria e uptime
router.post("/getHardWare", upload.none(''), verifyToken.verify, async (req, res, next) => {
  console.log("- getHardWare");
  //
  var getHardWare = {
    "noformat": {
      uptime: os.uptime(),
      freemem: os.freemem(),
      memusage: (os.totalmem() - os.freemem()),
      totalmem: os.totalmem(),
      freeusagemem: `${Math.round((os.freemem()*100)/os.totalmem()).toFixed(0)}`,
      usagemem: `${Math.round(((os.totalmem()-os.freemem())*100)/os.totalmem()).toFixed(0)}`
    },
    "format": {
      uptime: (os.uptime() + "").toHHMMSS(),
      freemem: convertBytes(os.freemem()),
      memusage: convertBytes((os.totalmem() - os.freemem())),
      totalmem: convertBytes(os.totalmem()),
      freeusagemem: `${Math.round((os.freemem()*100)/os.totalmem()).toFixed(0)} %`,
      usagemem: `${Math.round(((os.totalmem()-os.freemem())*100)/os.totalmem()).toFixed(0)} %`
    }
  };
  //console.log(result);
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    "Status": getHardWare
  });
}); //getHardWare
//
// ------------------------------------------------------------------------------------------------//
//
// Fecha a sessão
router.post("/Close", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
    case 'qrRead':
      //
      var closeSession = await Sessions.closeSession(req.body.SessionName.trim());
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": closeSession
      });
      //
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //Close
//
// ------------------------------------------------------------------------------------------------//
//
// Desconecta do whatsapp web
router.post("/Logout", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var LogoutSession = await Sessions.logoutSession(req.body.SessionName.trim());
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": LogoutSession
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //Logout
//
/*
╔╗ ┌─┐┌─┐┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐  ┬ ┬┌─┐┌─┐┌─┐┌─┐
╠╩╗├─┤└─┐││    ╠╣ │ │││││   │ ││ ││││└─┐  │ │└─┐├─┤│ ┬├┤ 
╚═╝┴ ┴└─┘┴└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘  └─┘└─┘┴ ┴└─┘└─┘
*/
//
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar Contato
router.post("/sendContactVcard", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var sendContactVcard = await Sessions.sendContactVcard(
          req.body.SessionName.trim(),
          checkNumberStatus.number,
          req.body.contact,
          req.body.namecontact
        );
        //
      } else {
        var sendContactVcard = checkNumberStatus;
      }
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendContactVcard
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendContactVcard
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar Contato
router.post("/sendContactVcardGroup", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var sendContactVcard = await Sessions.sendContactVcard(
        req.body.SessionName.trim(),
        req.body.groupId.trim() + '@g.us',
        checkNumberStatus.number,
        req.body.namecontact
      );
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendContactVcard
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendContactVcard
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar Texto
router.post("/sendText", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var sendText = await Sessions.sendText(
          req.body.SessionName.trim(),
          checkNumberStatus.number,
          req.body.msg
        );

        //
      } else {
        var sendText = checkNumberStatus;
      }
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendText
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendText
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar Texto em Massa
router.post("/sendTextMassa", upload.single('phonefull'), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var sendText = [];
      //
      var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-' + req.body.SessionName.trim() + '-'));
      var filePath = path.join(folderName, req.file.originalname);
      fs.writeFileSync(filePath, req.file.buffer.toString('base64'), 'base64');
      var originalname = path.basename(filePath);
      var mimetype = mime.lookup(filePath);
      //
      var arrayNumbers = fs.readFileSync(filePath, 'utf-8').toString().split(/\r?\n/);
      for (var i in arrayNumbers) {
        //console.log(arrayNumbers[i]);
        var numero = soNumeros(arrayNumbers[i]);
        //
        if (numero.length !== 0) {
          //
          var checkNumberStatus = await Sessions.checkNumberStatus(
            req.body.SessionName.trim(),
            soNumeros(numero) + '@c.us'
          );
          //
          if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
            //
            var sendTextMassaRes = await Sessions.sendText(
              req.body.SessionName.trim(),
              checkNumberStatus.number,
              req.body.msg
            );
            //
          } else {
            var sendTextMassaRes = checkNumberStatus;
          }
          //
          sendText.push(sendTextMassaRes);
          //
        }
        await sleep(1000);
      }
      //
      //
      await deletaArquivosTemp(filePath);
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendText
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendText
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar Texto em Grupo
router.post("/sendTextGrupo", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var sendText = await Sessions.sendText(
        req.body.SessionName.trim(),
        req.body.groupId.trim() + '@g.us',
        req.body.msg
      );
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendText
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendTextGrupo
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar localização
router.post("/sendLocation", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var sendLocation = await Sessions.sendLocation(
          req.body.SessionName.trim(),
          checkNumberStatus.number,
          req.body.lat,
          req.body.long,
          req.body.caption
        );
        //
      } else {
        var sendLocation = checkNumberStatus;
      }
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendLocation
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendLocation
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar localização no grupo
router.post("/sendLocationGroup", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var sendLocation = await Sessions.sendLocation(
        req.body.SessionName.trim(),
        req.body.groupId.trim() + '@g.us',
        req.body.lat,
        req.body.long,
        req.body.local
      );
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendLocation
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendLocation
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar links com preview
router.post("/sendLinkPreview", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var sendLinkPreview = await Sessions.sendLinkPreview(
          req.body.SessionName.trim(),
          checkNumberStatus.number,
          req.body.link,
          req.body.detail
        );
        //
      } else {
        var sendLinkPreview = checkNumberStatus;
      }
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendLinkPreview
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendLinkPreview
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar links com preview
router.post("/sendLinkPreviewGroup", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var sendLinkPreview = await Sessions.sendLinkPreview(
        req.body.SessionName.trim(),
        req.body.groupId.trim() + '@g.us',
        req.body.link,
        req.body.detail
      );
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendLinkPreview
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendLinkPreview
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar Imagem
router.post("/sendImage", upload.single('fileimg'), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var sendImage = await Sessions.sendImage(
          req.body.SessionName.trim(),
          checkNumberStatus.number.trim(),
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname,
          req.body.caption
        );
        //
      } else {
        var sendImage = checkNumberStatus;
      }
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendImage
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendImage
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar Imagem
router.post("/sendImageBase64", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-' + req.body.SessionName.trim() + '-'));
      var filePath = path.join(folderName, req.body.originalname);
      fs.writeFileSync(filePath, req.body.base64);
      var originalname = path.basename(filePath);
      var mimetype = mime.lookup(filePath);
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var sendImage = await Sessions.sendImage(
          req.body.SessionName.trim(),
          checkNumberStatus.number,
          Buffer.from(req.body.base64, 'base64'),
          mimetype,
          req.body.originalname,
          req.body.caption
        );
        //
      } else {
        var sendImage = checkNumberStatus;
      }
      //
      await deletaArquivosTemp(filePath);
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendImage
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendImage
//
// ------------------------------------------------------------------------------------------------//
//
//Enviar Imagem
router.post("/sendImageFromBase64", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var sendImage = await Sessions.sendImage(
          req.body.SessionName.trim(),
          checkNumberStatus.number,
          Buffer.from(req.body.base64, 'base64'),
          req.body.mimetype,
          req.body.originalname,
          req.body.caption
        );
        //
      } else {
        var sendImage = checkNumberStatus;
      }
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendImage
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendImage
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar Imagem em Massa
var sendImageMassa = upload.fields([{
  name: 'phonefull',
  maxCount: 1
}, {
  name: 'fileimg',
  maxCount: 1
}]);
//
router.post("/sendImageMassa", sendImageMassa, verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      //
      var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-' + req.body.SessionName.trim() + '-'));
      var filePathContato = path.join(folderName, req.files['phonefull'][0].originalname);
      fs.writeFileSync(filePathContato, req.files['phonefull'][0].buffer.toString('base64'), 'base64');
      console.log("- File:", filePathContato);
      //
      var sendImage = [];
      //
      var arrayNumbers = fs.readFileSync(filePathContato, 'utf-8').toString().split(/\r?\n/);
      for (var i in arrayNumbers) {
        //console.log(arrayNumbers[i]);
        var numero = arrayNumbers[i].trim();
        //
        if (numero.length !== 0) {
          //
          var checkNumberStatus = await Sessions.checkNumberStatus(
            req.body.SessionName.trim(),
            soNumeros(numero) + '@c.us'
          );
          //
          if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
            //
            var sendImageMassaRes = await Sessions.sendImage(
              req.body.SessionName.trim(),
              checkNumberStatus.number,
              req.files['fileimg'][0].buffer,
              req.files['fileimg'][0].mimetype,
              req.files['fileimg'][0].originalname,
              req.body.caption
            );
            //
          } else {
            var sendImageMassaRes = checkNumberStatus;
          }
          //
          //return sendResult;
          //
          sendImage.push(sendImageMassaRes);
        }
        await sleep(1000);
      }
      //
      await deletaArquivosTemp(filePathContato);
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendImage
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendImage
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar varia imagens
router.post("/sendMultImage", upload.array('fileimgs', 50), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      //
      var resultsFiles = req.files;
      //
      var sendImage = [];
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        await forEach(resultsFiles, async (resultfile) => {
          //
          var sendMultImageRes = await Sessions.sendImage(
            req.body.SessionName.trim(),
            checkNumberStatus.number,
            resultfile.buffer,
            resultfile.mimetype,
            resultfile.originalname,
            req.body.caption
          );
          //
          sendImage.push(sendMultImageRes);
          //
          await sleep(3000);
          //
        });
      } else {
        var sendImage = checkNumberStatus;
      }
      //
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendImage
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendImage
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar variar imagens para varios contaos
var sendMultImageMassa = upload.fields([{
  name: 'phonefull',
  maxCount: 1
}, {
  name: 'fileimgs',
  maxCount: 30
}]);
//
router.post("/sendMultImageMassa", sendMultImageMassa, verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      //
      var resultsFilesImg = req.files.fileimgs;
      //
      var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-' + req.body.SessionName.trim() + '-'));
      var filePathContato = path.join(folderName, req.files['phonefull'][0].originalname);
      fs.writeFileSync(filePathContato, req.files['phonefull'][0].buffer.toString('base64'), 'base64');
      console.log("- File Contato:", filePathContato);
      var arrayNumbers = fs.readFileSync(filePathContato, 'utf-8').toString().split(/\r?\n/);
      //
      var sendImage = [];
      //
      for (var i in arrayNumbers) {
        //console.log(arrayNumbers[i]);
        var numero = arrayNumbers[i].trim();
        //
        if (numero.length !== 0) {
          //
          var checkNumberStatus = await Sessions.checkNumberStatus(
            req.body.SessionName.trim(),
            soNumeros(numero) + '@c.us'
          );
          //
          if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
            //
            await forEach(resultsFilesImg, async (resultfile) => {
              //
              var sendMultImageMassaRes = await Sessions.sendImage(
                req.body.SessionName.trim(),
                checkNumberStatus.number,
                req.files['fileimgs'][0].buffer,
                req.files['fileimgs'][0].mimetype,
                req.files['fileimgs'][0].originalname,
                req.body.caption
              );
              //
              sendImage.push(sendMultImageMassaRes);
              //
              await sleep(3000);
              //
            });
            //
          } else {
            var sendImage = checkNumberStatus;
          }
        }
        await sleep(3000);
      }
      //
      await deletaArquivosTemp(filePathContato);
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendImage
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendImage
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar imagen no grupo
router.post("/sendImageGrupo", upload.single('fileimg'), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var sendImage = await Sessions.sendImage(
        req.body.SessionName.trim(),
        req.body.groupId.trim() + '@g.us',
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
        req.body.caption
      );
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendImage
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendImage
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar imagen no grupo
router.post("/sendImageBase64Grupo", upload.single(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-' + req.body.SessionName.trim() + '-'));
      var filePath = path.join(folderName, req.body.originalname);
      fs.writeFileSync(filePath, req.body.base64);
      var mimetype = mime.lookup(filePath);
      //
      var sendImage = await Sessions.sendImage(
        req.body.SessionName.trim(),
        req.body.groupId.trim() + '@g.us',
        Buffer.from(req.body.base64, 'base64'),
        mimetype,
        req.body.originalname,
        req.body.caption
      );
      //
      await deletaArquivosTemp(filePath);
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendImage
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendImage
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar imagen no grupo
router.post("/sendImageFromBase64Grupo", upload.single(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var sendImage = await Sessions.sendImage(
        req.body.SessionName.trim(),
        req.body.groupId.trim() + '@g.us',
        Buffer.from(req.body.base64, 'base64'),
        req.body.mimetype,
        req.body.originalname,
        req.body.caption
      );
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendImage
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendImage
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendFile", upload.single('file'), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var sendFile = await Sessions.sendFile(
          req.body.SessionName.trim(),
          checkNumberStatus.number,
          req.file.buffer,
          req.file.mimetype,
          req.file.originalname,
          req.file.mimetype.split('/')[1],
          req.body.caption
        );
        //
      } else {
        var sendFile = checkNumberStatus;
      }
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendFile
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendFile
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendFileGroup", upload.single('file'), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var sendFile = await Sessions.sendFile(
        req.body.SessionName.trim(),
        req.body.groupId.trim() + '@g.us',
        req.file.buffer,
        req.file.mimetype,
        req.file.originalname,
        req.body.caption
      );
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendFile
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendFile
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendFileBase64", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-' + req.body.SessionName.trim() + '-'));
      var filePath = path.join(folderName, req.body.originalname);
      fs.writeFileSync(filePath, req.body.base64, 'base64');
      var originalname = path.basename(filePath);
      var mimetype = mime.lookup(filePath);
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull).trim() + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var sendFile = await Sessions.sendFile(
          req.body.SessionName.trim(),
          checkNumberStatus.number,
          Buffer.from(req.body.base64, 'base64'),
          mimetype,
          req.body.originalname,
          req.body.caption
        );
        //
      } else {
        var sendFile = checkNumberStatus;
      }
      //
      await deletaArquivosTemp(filePath);
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendFile
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendFile
//
// ------------------------------------------------------------------------------------------------//
//
// Enviar arquivo/documento
router.post("/sendFileBase64Group", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-' + req.body.SessionName.trim() + '-'));
      var filePath = path.join(folderName, req.body.originalname);
      fs.writeFileSync(filePath, req.body.base64, 'base64');
      var originalname = path.basename(filePath);
      var mimetype = mime.lookup(filePath);
      //
      var sendFile = await Sessions.sendFile(
        req.body.SessionName.trim(),
        req.body.groupId.trim() + '@g.us',
        Buffer.from(req.body.base64, 'base64'),
        mimetype,
        req.body.originalname,
        req.body.caption
      );
      //
      await deletaArquivosTemp(filePath);
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendFile
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendFile
//
// ------------------------------------------------------------------------------------------------------- //
//
// Enviar arquivo/documento
router.post("/sendFileFromBase64", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var sendFile = await Sessions.sendFile(
          req.body.SessionName.trim(),
          checkNumberStatus.number,
          Buffer.from(req.body.base64, 'base64'),
          req.body.mimetype,
          req.body.originalname,
          req.body.caption
        );
        //
      } else {
        var sendFile = checkNumberStatus;
      }
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendFile
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendFile
//
// ------------------------------------------------------------------------------------------------------- //
//
// Enviar arquivo/documento
router.post("/sendFileFromBase64Group", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var sendFile = await Sessions.sendFile(
        req.body.SessionName.trim(),
        req.body.groupId.trim() + '@g.us',
        Buffer.from(req.body.base64, 'base64'),
        req.body.mimetype,
        req.body.originalname,
        req.body.caption
      );
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": sendFile
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //sendFile
//
// ------------------------------------------------------------------------------------------------//
//
/*
╦═╗┌─┐┌┬┐┬─┐┬┌─┐┬  ┬┬┌┐┌┌─┐  ╔╦╗┌─┐┌┬┐┌─┐                
╠╦╝├┤  │ ├┬┘│├┤ └┐┌┘│││││ ┬   ║║├─┤ │ ├─┤                
╩╚═└─┘ ┴ ┴└─┴└─┘ └┘ ┴┘└┘└─┘  ═╩╝┴ ┴ ┴ ┴ ┴                
*/
//
// Recuperar contatos
router.post("/getAllContacts", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var getAllContacts = await Sessions.getAllContacts(
        req.body.SessionName
      );
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": getAllContacts
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //getAllContacts
//
// ------------------------------------------------------------------------------------------------------- //
//
/*
// Recuperar chats
router.post("/getAllChats", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var getAllContacts = await Sessions.getAllChats(
        req.body.SessionName
      );
      //
      res.json({
        getAllContacts
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
res.status(400).json({
        "getAllChats": sessionStatus
      });
  }
}); //getAllChats
*/
// ------------------------------------------------------------------------------------------------------- //
//
// Recuperar grupos
router.post("/getAllGroups", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var getAllContacts = await Sessions.getAllGroups(
        req.body.SessionName
      );
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": getAllContacts
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //getAllGroups
//
// ------------------------------------------------------------------------------------------------------- //
//
// Returns browser session token
router.post("/getSessionTokenBrowser", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var getSessionTokenBrowser = await Sessions.getSessionTokenBrowser(
        req.body.SessionName
      );
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        getSessionTokenBrowser
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "getSessionTokenBrowser": sessionStatus
      });
  }
}); //getSessionTokenBrowser
//
// ------------------------------------------------------------------------------------------------------- //
//
// Chama sua lista de contatos bloqueados
router.post("/getBlockList", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var getBlockList = await Sessions.getBlockList(
        req.body.SessionName
      );
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": getBlockList
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //getBlockList
//
// ------------------------------------------------------------------------------------------------//
//
// Recuperar status de contato
router.post("/getStatus", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var getStatus = await Sessions.getStatus(
          req.body.SessionName.trim(),
          checkNumberStatus.number
        );
        //
      } else {
        var getStatus = checkNumberStatus;
      }
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": getStatus
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //getStatus
//
// ------------------------------------------------------------------------------------------------------- //
//
// Obter o perfil do número
router.post("/getNumberProfile", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var getNumberProfile = await Sessions.getNumberProfile(
          req.body.SessionName.trim(),
          soNumeros(req.body.phonefull) + '@c.us'
        );
        //
      } else {
        var getNumberProfile = checkNumberStatus;
      }
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": getNumberProfile
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //getNumberProfile
//
// ------------------------------------------------------------------------------------------------------- //
//
// Obter a foto do perfil no servidor
router.post("/getProfilePicFromServer", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var getProfilePicFromServer = await Sessions.getProfilePicFromServer(
          req.body.SessionName.trim(),
          checkNumberStatus.number
        );
        //
      } else {
        var getProfilePicFromServer = checkNumberStatus;
      }
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": getProfilePicFromServer
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //getProfilePicFromServer
//
// ------------------------------------------------------------------------------------------------------- //
//
// Verificar o status do número
router.post("/checkNumberStatus", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": checkNumberStatus
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //checkNumberStatus
//
// ------------------------------------------------------------------------------------------------------- //
//
// Verificar o status do número
router.post("/phoneValidate", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var phone = soNumeros(req.body.phonefull);
      var validPhone = await validatePhone(phone);
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": validPhone
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //checkNumberStatus
//
// ------------------------------------------------------------------------------------------------------- //
//
// Verificar o status do número em massa
router.post("/checkNumberStatusMassa", upload.single('contatos'), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-' + req.body.SessionName.trim() + '-'));
      var filePath = path.join(folderName, req.file.originalname);
      fs.writeFileSync(filePath, req.file.buffer.toString('base64'), 'base64');
      console.log("- File:", filePath);
      //
      var checkNumberStatusMassa = [];
      //
      var arrayNumbers = fs.readFileSync(filePath, 'utf-8').toString().split(/\r?\n/);
      for (var i in arrayNumbers) {
        //console.log(soNumeros(arrayNumbers[i]));
        var numero = soNumeros(arrayNumbers[i]);
        //
        if (numero.length !== 0) {
          //
          var checkNumberStatus = await Sessions.checkNumberStatus(
            req.body.SessionName.trim(),
            soNumeros(numero) + '@c.us'
          );
          //
          if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
            //
            checkNumberStatusMassa.push(checkNumberStatus);
            //
          } else {
            var checkNumberStatusMassa = checkNumberStatus;
          }
        }
        await sleep(1000);
      }
      //
      await deletaArquivosTemp(filePath);
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": checkNumberStatusMassa
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //checkNumberStatusMassa
//
// ------------------------------------------------------------------------------------------------------- //
//
/*
╔═╗┬─┐┌─┐┬ ┬┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐               
║ ╦├┬┘│ ││ │├─┘  ╠╣ │ │││││   │ ││ ││││└─┐               
╚═╝┴└─└─┘└─┘┴    ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘               
*/
//
//Deixar o grupo
router.post("/leaveGroup", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var leaveGroup = await Sessions.leaveGroup(
        req.body.SessionName.trim(),
        req.body.groupId + '@g.us'
      );
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": leaveGroup
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //leaveGroup
//
// ------------------------------------------------------------------------------------------------------- //
//
// Obtenha membros do grupo
router.post("/getGroupMembers", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var getGroupMembers = await Sessions.getGroupMembers(
        req.body.SessionName.trim(),
        req.body.groupId + '@g.us'
      );
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": getGroupMembers
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //getGroupMembers
//
// ------------------------------------------------------------------------------------------------//
//
// Obter IDs de membros do grupo 
router.post("/getGroupMembersIds", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var getGroupMembersIds = await Sessions.getGroupMembersIds(
        req.body.SessionName.trim(),
        req.body.groupId + '@g.us'
      );
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": getGroupMembersIds
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //getGroupMembersIds
//
// ------------------------------------------------------------------------------------------------//
//
// Gerar link de url de convite de grupo
router.post("/getGroupInviteLink", upload.none(''), verifyToken.verify, async (req, res, next) => {
  //
  // Gerar link de url de convite de grupo
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var GroupInviteLink = await Sessions.getGroupInviteLink(
        req.body.SessionName.trim(),
        req.body.groupId + '@g.us'
      );
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": GroupInviteLink
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //getGroupInviteLink
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/createGroup", upload.single('participants'), verifyToken.verify, async (req, res, next) => {
  //
  // Criar grupo (título, participantes a adicionar)
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      //
      var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-' + req.body.SessionName.trim() + '-'));
      var filePath = path.join(folderName, req.file.originalname);
      fs.writeFileSync(filePath, req.file.buffer.toString('base64'), 'base64');
      console.log("- File:", filePath);
      //
      var arrayNumbers = fs.readFileSync(filePath, 'utf-8').toString().split(/\r?\n/);
      //
      var contactlistValid = [];
      var contactlistInvalid = [];
      //
      for (var i in arrayNumbers) {
        //console.log(arrayNumbers[i]);
        var numero = soNumeros(arrayNumbers[i]);
        //
        if (numero.length !== 0) {
          //
          var checkNumberStatus = await Sessions.checkNumberStatus(
            req.body.SessionName.trim(),
            numero + '@c.us'
          );
          //
          if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
            //
            contactlistValid.push(checkNumberStatus.number);
          } else {
            contactlistInvalid.push(numero + '@s.whatsapp.net');
          }
          //
        }
        //
        await sleep(1000);
      }
      //
      var createGroup = await Sessions.createGroup(
        req.body.SessionName.trim(),
        req.body.title,
        contactlistValid,
        contactlistInvalid
      );
      //
      await deletaArquivosTemp(filePath);
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": createGroup
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //createGroup
//
// ------------------------------------------------------------------------------------------------//
//
// Criar grupo (título, participantes a adicionar)
router.post("/createCountGroup", upload.single('participants'), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var createCountGroup = [];
      var createGroup = [];
      //
      var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-' + req.body.SessionName.trim() + '-'));
      var filePath = path.join(folderName, req.file.originalname);
      fs.writeFileSync(filePath, req.file.buffer.toString('base64'), 'base64');
      console.log("- File:", filePath);
      //
      var arrayNumbers = fs.readFileSync(filePath, 'utf-8').toString().split(/\r?\n/);
      //
      var contactlistValid = [];
      var contactlistInvalid = [];
      //
      for (var i in arrayNumbers) {
        //console.log(arrayNumbers[i]);
        var numero = soNumeros(arrayNumbers[i]);
        //
        if (numero.length !== 0) {
          //

          var checkNumberStatus = await Sessions.checkNumberStatus(
            req.body.SessionName.trim(),
            numero + '@c.us'
          );
          //
          if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
            //
            contactlistValid.push(checkNumberStatus.number);
          } else {
            contactlistInvalid.push(numero + '@s.whatsapp.net');
          }
          //
        }
        //
        await sleep(1000);
      }
      //
      for (count = 1; count <= req.body.count; count++) {
        var resCreateGroup = await Sessions.createGroup(
          req.body.SessionName.trim(),
          req.body.title + "-" + count,
          contactlistValid,
          contactlistInvalid
        );
        //
        await sleep(5000);
        //
        createCountGroup.push(resCreateGroup);
        //
        createGroup.push({
          "createGroup": createCountGroup
        });
        //
      }
      //
      await deletaArquivosTemp(filePath);
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": createGroup
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //createCountGroup
//
// ------------------------------------------------------------------------------------------------//
//
// Criar grupo (título, participantes a adicionar)
router.post("/createGroupSetAdminMembers", upload.single('participants'), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var createGroupSetAdminMembers = [];
      //
      var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-' + req.body.SessionName.trim() + '-'));
      var filePath = path.join(folderName, req.file.originalname);
      fs.writeFileSync(filePath, req.file.buffer.toString('base64'), 'base64');
      console.log("- File:", filePath);
      //
      var arrayNumbers = fs.readFileSync(filePath, 'utf-8').toString().split(/\r?\n/);
      //
      var contactlistValid = [];
      var contactlistInvalid = [];
      //
      for (var i in arrayNumbers) {
        //console.log(arrayNumbers[i]);
        var numero = soNumeros(arrayNumbers[i]);
        //
        if (numero.length !== 0) {
          //

          var checkNumberStatus = await Sessions.checkNumberStatus(
            req.body.SessionName.trim(),
            numero + '@c.us'
          );
          //
          if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
            //
            contactlistValid.push(checkNumberStatus.number);
          } else {
            contactlistInvalid.push(numero + '@s.whatsapp.net');
          }

          //
        }
        //
        await sleep(2000);
      }
      //
      var createGroup = await Sessions.createGroup(
        req.body.SessionName.trim(),
        req.body.title,
        contactlistValid,
        contactlistInvalid
      );
      //
      createGroupSetAdminMembers.push(createGroup);
      //
      await sleep(2000);
      //
      const groupMetadata = await client.groupMetadata(groupId).then(async (result) => {
        //console.log('- Grupo validado com sucesso.');
        return result;
      }).catch((erro) => {
        console.error('- Error validar grupo.');
        //
        return {
          "erro": true,
          "status": 404,
          "message": "Error validar grupo"
        };
        //
      });
      //
      await sleep(2000);
      //
      if (groupMetadata.erro == false && groupMetadata.status == 200 || groupMetadata.status == 207) {
        //
        var promoteParticipant = await Sessions.promoteParticipant(
          req.body.SessionName.trim(),
          groupMetadata.groupId + '@g.us',
          contactlistValid
        );
        //
        createGroupSetAdminMembers.push(promoteParticipant);
        //
      } else {
        var createGroupSetAdminMembers = createGroup;
      }
      //
      await deletaArquivosTemp(filePath);
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": createGroupSetAdminMembers
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //createGroupSetAdminMembers
//
// ------------------------------------------------------------------------------------------------//
//
// Criar grupo (título, participantes a adicionar)
router.post("/createCountGroupSetAdminMembers", upload.single('participants'), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var createCountGroupSetAdminMembers = [];
      var createGroup = [];
      //
      var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-' + req.body.SessionName.trim() + '-'));
      var filePath = path.join(folderName, req.file.originalname);
      fs.writeFileSync(filePath, req.file.buffer.toString('base64'), 'base64');
      console.log("- File:", filePath);
      //
      var arrayNumbers = fs.readFileSync(filePath, 'utf-8').toString().split(/\r?\n/);
      //
      var contactlistValid = [];
      var contactlistInvalid = [];
      //
      for (var i in arrayNumbers) {
        //console.log(arrayNumbers[i]);
        var numero = soNumeros(arrayNumbers[i]);
        //
        if (numero.length !== 0) {
          //

          var checkNumberStatus = await Sessions.checkNumberStatus(
            req.body.SessionName.trim(),
            numero + '@c.us'
          );
          //
          if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
            //
            contactlistValid.push(checkNumberStatus.number);
          } else {
            contactlistInvalid.push(numero + '@s.whatsapp.net');
          }

          //
        }
        //
        await sleep(2000);
      }
      //
      for (count = 1; count <= req.body.count; count++) {
        var resCreateGroup = await Sessions.createGroup(
          req.body.SessionName.trim(),
          req.body.title + "-" + count,
          contactlistValid,
          contactlistInvalid
        );
        //
        await sleep(5000);
        //
        createCountGroupSetAdminMembers.push(resCreateGroup);
        //
        if (resCreateGroup.erro !== true && resCreateGroup.status !== 404) {
          //
          var promoteParticipant = await Sessions.promoteParticipant(
            req.body.SessionName.trim(),
            resCreateGroup.groupId + '@g.us',
            resCreateGroup.contactlistValid
          );
          //
          createCountGroupSetAdminMembers.push(promoteParticipant);
          //
          //
        } else {
          var createCountGroupSetAdminMembers = resCreateGroup;
        }
        //
        createGroup.push({
          "createGroup": createCountGroupSetAdminMembers
        });
        //
      }
      //
      await deletaArquivosTemp(filePath);
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": createGroup
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //createCountGroupSetAdminMembers
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/removeParticipant", upload.none(''), verifyToken.verify, async (req, res, next) => {
  //
  // Remove participante
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull).trim() + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var removeParticipant = await Sessions.removeParticipant(
          req.body.SessionName.trim(),
          req.body.groupId.trim() + '@g.us',
          [checkNumberStatus.number]
        );
        //
      } else {
        var removeParticipant = checkNumberStatus;
      }
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": removeParticipant
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //removeParticipant
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/addParticipant", upload.none(''), verifyToken.verify, async (req, res, next) => {
  //
  // Adicionar participante
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var addParticipant = await Sessions.addParticipant(
          req.body.SessionName.trim(),
          req.body.groupId.trim() + '@g.us',
          [checkNumberStatus.number]
        );
        //
      } else {
        var addParticipant = checkNumberStatus;
      }
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": addParticipant
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //addParticipant
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/promoteParticipant", upload.none(''), verifyToken.verify, async (req, res, next) => {
  //
  // Promote participant (Give admin privileges)
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var promoteParticipant = await Sessions.promoteParticipant(
          req.body.SessionName.trim(),
          req.body.groupId.trim() + '@g.us',
          [checkNumberStatus.number]
        );
        //
      } else {
        var promoteParticipant = checkNumberStatus;
      }
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": promoteParticipant
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //promoteParticipant
//
// ------------------------------------------------------------------------------------------------//
//
// Depromote participant (Give admin privileges)
router.post("/demoteParticipant", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'isLogged':
      //
      var checkNumberStatus = await Sessions.checkNumberStatus(
        req.body.SessionName.trim(),
        soNumeros(req.body.phonefull) + '@c.us'
      );
      //
      if (checkNumberStatus.status === 200 && checkNumberStatus.erro === false) {
        //
        var demoteParticipant = await Sessions.demoteParticipant(
          req.body.SessionName.trim(),
          req.body.groupId.trim() + '@g.us',
          [checkNumberStatus.number]
        );
        //
      } else {
        var demoteParticipant = checkNumberStatus;
      }
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": demoteParticipant
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //demoteParticipant
//
// ------------------------------------------------------------------------------------------------//
//
// Retorna o status do grupo, jid, descrição do link de convite
router.post("/getGroupInfoFromInviteLink", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var getGroupInfoFromInviteLink = await Sessions.getGroupInfoFromInviteLink(
        req.body.SessionName.trim(),
        req.body.InviteCode
      );
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        getGroupInfoFromInviteLink
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "getGroupInfoFromInviteLink": sessionStatus
      });
  }
}); //getGroupInfoFromInviteLink
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/joinGroup", upload.none(''), verifyToken.verify, async (req, res, next) => {
  //
  // Junte-se a um grupo usando o código de convite do grupo
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var joinGroup = await Sessions.joinGroup(
        req.body.SessionName.trim(),
        req.body.InviteCode
      );
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": joinGroup
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //joinGroup
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/onlyAdminsMessagesGroup", upload.none(''), verifyToken.verify, async (req, res, next) => {
  //
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var onlyAdminsMessagesGroup = await Sessions.onlyAdminsMessagesGroup(
        req.body.SessionName.trim(),
        req.body.groupId + '@g.us'
      );
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": onlyAdminsMessagesGroup
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //onlyAdminsMessagesGroup
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/everyoneModifySettingsGroup", upload.none(''), verifyToken.verify, async (req, res, next) => {
  //
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var everyoneModifySettingsGroup = await Sessions.everyoneModifySettingsGroup(
        req.body.SessionName.trim(),
        req.body.groupId + '@g.us',
        req.body.change
      );
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": everyoneModifySettingsGroup
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //everyoneModifySettingsGroup
//
// ------------------------------------------------------------------------------------------------//
//
/*
╔═╗┬─┐┌─┐┌─┐┬┬  ┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐           
╠═╝├┬┘│ │├┤ ││  ├┤   ╠╣ │ │││││   │ ││ ││││└─┐           
╩  ┴└─└─┘└  ┴┴─┘└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘           
*/
//
router.post("/setProfileStatus", upload.none(''), verifyToken.verify, async (req, res, next) => {
  //
  // Set client status
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var setProfileStatus = await Sessions.setProfileStatus(
        req.body.SessionName.trim(),
        req.body.ProfileStatus
      );
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": setProfileStatus
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //setProfileStatus
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/setProfileName", upload.none(''), verifyToken.verify, async (req, res, next) => {
  //
  // Set client profile name
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var setProfileName = await Sessions.setProfileName(
        req.body.SessionName.trim(),
        req.body.ProfileName
      );
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": setProfileName
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //setProfileName
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/setProfilePic", upload.single('fileimg'), verifyToken.verify, async (req, res, next) => {
  //

  //
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      //
      var folderName = fs.mkdtempSync(path.join(os.tmpdir(), 'baileys-' + req.body.SessionName.trim() + '-'));
      var filePath = path.join(folderName, req.file.originalname);
      fs.writeFileSync(filePath, req.file.buffer.toString('base64'), 'base64');
      console.log("- File", filePath);
      //
      var setProfilePic = await Sessions.setProfilePic(
        req.body.SessionName.trim(),
        filePath
      );
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": setProfilePic
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //setProfilePic
//
// ------------------------------------------------------------------------------------------------//
//
/*
╔╦╗┌─┐┬  ┬┬┌─┐┌─┐  ╔═╗┬ ┬┌┐┌┌─┐┌┬┐┬┌─┐┌┐┌┌─┐             
 ║║├┤ └┐┌┘││  ├┤   ╠╣ │ │││││   │ ││ ││││└─┐             
═╩╝└─┘ └┘ ┴└─┘└─┘  ╚  └─┘┘└┘└─┘ ┴ ┴└─┘┘└┘└─┘             
*/
//
// Delete the Service Worker
router.post("/killServiceWorker", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var killServiceWorker = await Sessions.killServiceWorker(req.body.SessionName.trim());
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": killServiceWorker
      });
      //
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //killServiceWorker
//
// ------------------------------------------------------------------------------------------------//
//
// Load the service again
router.post("/restartService", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var restartService = await Sessions.restartService(req.body.SessionName.trim());
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": restartService
      });
      //
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //restartService
//
// ------------------------------------------------------------------------------------------------//
//
// Reload do whatsapp web
router.post("/reloadService", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
    case 'notLogged':
    case 'deviceNotConnected':
    case 'desconnectedMobile':
    case 'qrReadFail':
    case 'deleteToken':
    case 'DISCONNECTED':
      //
      try {
        var killServiceWorker = await Sessions.killServiceWorker(req.body.SessionName.trim());
        //
        if (killServiceWorker.erro === false && killServiceWorker.status === 200) {
          //
          var restartService = await Sessions.restartService(req.body.SessionName.trim());
          //
          if (restartService.erro === false && restartService.status === 200) {
            //
            var reload = restartService;
            //
            //await deletaToken(session.tokenPatch + "/" + req.body.SessionName + ".data.json");
            //
            res.setHeader('Content-Type', 'application/json');
            res.status(200).json({
              "Status": reload
            });
            //
          } else {
            //
            var reload = restartService;
            //
            res.setHeader('Content-Type', 'application/json');
            res.status(400).json({
              "Status": reload
            });
            //
          }
          //
        } else {
          //
          var reload = killServiceWorker;
          //
          res.setHeader('Content-Type', 'application/json');
          res.status(400).json({
            "Status": reload
          });
          //
        }
      } catch (error) {
        //
        res.setHeader('Content-Type', 'application/json');
        res.status(404).json({
          "reloadService": {
            "erro": true,
            "status": 404,
            "message": "Sessão não iniciada.",
            "restartService": false
          }
        });
        //
      }
      //
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //reloadService
//
// ------------------------------------------------------------------------------------------------//
//
// Get device info
router.post("/getHostDevice", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var getHostDevice = await Sessions.getHostDevice(req.body.SessionName.trim());
      //
      //console.log(result);
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": getHostDevice
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //getHostDevice
//
// ------------------------------------------------------------------------------------------------//
//
// Get connection state
router.post("/getConnectionState", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var getConnectionState = await Sessions.getConnectionState(req.body.SessionName.trim());
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": getConnectionState
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //getConnectionState
//
// ------------------------------------------------------------------------------------------------//
//
// Get battery level
router.post("/getBatteryLevel", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var getBatteryLevel = await Sessions.getBatteryLevel(req.body.SessionName.trim());
      //
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": getBatteryLevel
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //getBatteryLevel
//
// ------------------------------------------------------------------------------------------------//
//
// Is Connected
router.post("/isConnected", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var isConnected = await Sessions.isConnected(req.body.SessionName.trim());
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": isConnected
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //isConnected
//
// ------------------------------------------------------------------------------------------------//
//
// Obter versão da web do Whatsapp
router.post("/getWAVersion", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var getWAVersion = await Sessions.getWAVersion(req.body.SessionName.trim());
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": getWAVersion
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //getWAVersion
//
// ------------------------------------------------------------------------------------------------//
//
// Inicia a verificação de conexão do telefone
router.post("/startPhoneWatchdog", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var startPhoneWatchdog = await Sessions.startPhoneWatchdog(
        req.body.SessionName.trim(),
        req.body.interval
      );
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": startPhoneWatchdog
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //startPhoneWatchdog
//
// ------------------------------------------------------------------------------------------------//
//
// Para a verificação de conexão do telefone
router.post("/stopPhoneWatchdog", upload.none(''), verifyToken.verify, async (req, res, next) => {
  var sessionStatus = await Sessions.ApiStatus(req.body.SessionName.trim());
  switch (sessionStatus.status) {
    case 'inChat':
    case 'qrReadSuccess':
    case 'isLogged':
    case 'chatsAvailable':
      //
      var stopPhoneWatchdog = await Sessions.stopPhoneWatchdog(req.body.SessionName.trim());
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({
        "Status": stopPhoneWatchdog
      });
      break;
    default:
      res.setHeader('Content-Type', 'application/json');
      res.status(400).json({
        "Status": sessionStatus
      });
  }
}); //stopPhoneWatchdog
//
// ------------------------------------------------------------------------------------------------//
//
/*
╔╦╗┌─┐┌─┐┌┬┐┌─┐┌─┐  ┌┬┐┌─┐  ╦═╗┌─┐┌┬┐┌─┐┌─┐
 ║ ├┤ └─┐ │ ├┤ └─┐   ││├┤   ╠╦╝│ │ │ ├─┤└─┐
 ╩ └─┘└─┘ ┴ └─┘└─┘  ─┴┘└─┘  ╩╚═└─┘ ┴ ┴ ┴└─┘
 */
//
// ------------------------------------------------------------------------------------------------//
//
router.post("/RotaTeste", upload.single('fileimg'), async (req, res, next) => {
  //
  /*
  console.log(req.file.mimetype);
  const mimetype = req.file.mimetype;
  //
  switch (mimetype) {
    case 'image/gif':
      //
      res.setHeader('Content-Type', 'application/json');
res.status(200).json({
        error: false,
        message: 'Arquivo imagem gif'
      });
      //
      break;
    case 'video/gif':
      //
      res.setHeader('Content-Type', 'application/json');
res.status(200).json({
        error: false,
        message: 'Arquivo video gif'
      });
      //
      break;
    case 'image/jpeg':
      //
      res.setHeader('Content-Type', 'application/json');
res.status(200).json({
        error: false,
        message: 'Arquivo jpeg'
      });
      //
      break;
    case 'video/mp4':
      //
      res.setHeader('Content-Type', 'application/json');
res.status(200).json({
        error: false,
        message: 'Arquivo video mp4'
      });
      //
      break;
    case 'audio/mp4':
      //
      res.setHeader('Content-Type', 'application/json');
res.status(200).json({
        error: false,
        message: 'Arquivo mp4Audio'
      });
      //
      break;
    case 'audio/ogg; codecs=opus':
      //
      res.setHeader('Content-Type', 'application/json');
res.status(200).json({
        error: false,
        message: 'Arquivo ogg'
      });
      //
      break;
    case 'application/pdf':
      //
      res.setHeader('Content-Type', 'application/json');
res.status(200).json({
        error: false,
        message: 'Arquivo pdf'
      });
      //
      break;
    case 'image/png':
      //
      res.setHeader('Content-Type', 'application/json');
res.status(200).json({
        error: false,
        message: 'Arquivo png'
      });
      //
      break;
    case 'image/webp':
      //
      res.setHeader('Content-Type', 'application/json');
res.status(200).json({
        error: false,
        message: 'Arquivo webp'
      });
      //
      break;
    default:
      //
      res.setHeader('Content-Type', 'application/json');
res.status(200).json({
        error: true,
        message: 'Arquivo invalido'
      });
      //
  }
	*/
  //
  var resRotaTeste = await Sessions.RotaTeste(req.body.SessionName.trim());
  //
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    "RotaTeste": resRotaTeste
  });
});
//
// ------------------------------------------------------------------------------------------------//
//
module.exports = router;