//
const Sessions = require('../controllers/sessions');
// const Cache = require('../util/cache');

async function checkNumber(req, res, next) {
  // Normaliza os parâmetros de entrada
  let number = req.body.number || req.body.phonefull;
  let sessionName = req.body.session || req.body.SessionName;

  if (!sessionName) {
    return res.status(400).send({ message: 'Nome da sessão não informado.' });
  }

  // Correção: getSession é async, precisa de await
  let data = await Sessions.getSession(sessionName);

  if (!data || !data.client) {
    return res.status(404).send({ message: 'Sessão não encontrada ou não conectada.' });
  }

  try {
    if (!number) {
      return res.status(400).send({ message: 'Telefone não informado.' });
    }

    // Se for grupo ou broadcast, passa direto
    if (number.includes('-') || number.includes('@g.us') || number.includes('@broadcast')) {
      next();
      return;
    }

    // Verifica se o número existe no WhatsApp (Baileys v6+)
    const [result] = await data.client.onWhatsApp(number);

    if (result && result.exists) {
      // Atualiza o número com o JID correto retornado pelo WhatsApp
      if (req.body.number) req.body.number = result.jid;
      if (req.body.phonefull) req.body.phonefull = result.jid;
      next();
    } else {
      return res.status(400).json({
        response: false,
        status: 'error',
        message: 'O telefone informado não esta registrado no whatsapp.',
      });
    }
  } catch (error) {
    console.error("Erro no checkNumber:", error);
    next(error);
  }
}

exports.checkNumber = checkNumber
