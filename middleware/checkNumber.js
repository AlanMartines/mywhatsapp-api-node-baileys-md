//
const Sessions = require('../controllers/sessions')
const Cache = require('../util/cache');

async function checkNumber(req, res, next) {
  const c = '@c.us';
  let number = req?.body?.number;
  let session = req?.body?.session;
  let data = Sessions?.getSession(session);
  let onlyNumbers = /^\d+\-\d+$/.test(number);

  try {
      if (!number) {
        return res?.status(401)?.send({ message: 'Telefone não informado?.' });
      } else if (number.length < 12) {
        return res?.status(401)?.send({ message: 'Numero invalido.' });
      } else if (
        (number.length > 13 && number.length < 18) ||
        (number.length > 18 && number.length < 23) ||
        number.length > 24
      ) {
        return res?.status(401)?.send({ message: 'Numero invalido.' });
      } else if (number.length == 18 && isNaN(number) == true) {
        return res?.status(401)?.send({ message: 'Numero invalido.' });
      } else if (number.length == 18 && isNaN(number) == false) {
        await Cache.set(number, number + '@g.us');
        next();
      } else if (
        (number.length === 23 || number.length === 24) &&
        !number.includes('-')
      ) {
        return res?.status(401)?.send({ message: 'Numero invalido.' });
      } else if (
        (number.length === 23 || number.length === 24) &&
        onlyNumbers === false
      ) {
        return res?.status(401)?.send({ message: 'Numero invalido.' });
      } else if (
        (number.length === 23 || number.length === 24) &&
        onlyNumbers === true
      ) {
        await Cache.set(number, number + '@g.us');
        next();
      } else if (number.includes('@broadcast')) {
        await Cache.set(number, number);
        next();
      } else if (!number?.includes('-')) {
        const value = await Cache.get(number);
        if (value != null) {
          next();
        } else {
          let profile =
            number?.indexOf('-') > -1
              ? number + '@g.us'
              : await data?.client?.checkNumberStatus(req?.body?.number + c);
          if (!profile?.numberExists) {
            return res?.status(400)?.json({
              response: false,
              status: 'error',
              message: 'O telefone informado nao esta registrado no whatsapp.',
            });
          } else {
            await Cache.set(number, profile.id._serialized);
            next();
          }
        }
      }
  } catch (error) {
    next(error);
  }
}

exports.checkNumber = checkNumber
