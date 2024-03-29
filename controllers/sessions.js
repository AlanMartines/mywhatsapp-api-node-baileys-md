const urlExists = require("url-exists");
const fs = require('fs-extra');
const { fromBuffer } = require('file-type');
const mimeTypes = require('mime-types');
const fileType = require('file-type');
const axios = require('axios');
const chalk = require('chalk');
const boxen = require('boxen');

module.exports = class Sessions {

  static session = new Array()

  static async isURL(str) {
    var pattern = new RegExp(
      '^(https?:\\/\\/)?' +
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' +
      '((\\d{1,3}\\.){3}\\d{1,3}))' +
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
      '(\\?[;&a-z\\d%_.~+=-]*)?' +
      '(\\#[-a-z\\d_]*)?$',
      'i'
    );
    return pattern.test(str);
  }

  static async checkPath(path) {
    urlExists(path, (error, exists) => {
      if (exists) {
        return true
      }
      else {
        return false
      }
    })
  }

  static async sleep(ms) {
    let time = parseInt(ms) | 1
    return new Promise(resolve => setTimeout(resolve, time));
  }

  // checar ou adiciona um usuario na sessão
  static async checkAddUser(name) {
    var checkFilter = this.session?.filter(order => (order?.SessionName === name)), add = null
    if (!checkFilter?.length) {
      add = {
        SessionName: name,
      }
      this.session?.push(add);
      return true
    }
    return false
  }

  // checar se exite o usuario na sessão
  static async checkSession(name) {
    var checkFilter = this.session?.filter(order => (order?.SessionName === name))
    if (checkFilter?.length) {
      return true
    }
    return false
  }

  // pegar index da sessão (chave)
  static async getSessionKey(name) {
    if (await this.checkSession(name)) {
      for (var i in this.session) {
        if (this.session[i]?.SessionName === name) {
          return i
        }
      }
    }
    return false
  }

  // adicionar informações a sessão 
  static async addInfoSession(name, extend) {
    if (await this.checkSession(name)) {
      for (var i in this.session) {
        if (this.session[i]?.SessionName === name) {
          Object?.assign(this.session[i], extend);
          return true
        }
      }
    }
    return false
  }

  // Remove object na sessão
  static async removeInfoObjects(name, key) {
    if (await this.checkSession(name)) {
      for (var i in this.session) {
        if (this.session[i]?.SessionName === name) {
          delete this.session[i][key]
          return true
        }
      }
    }
    return false
  }

  // deletar sessão
  static async deleteSession(name) {
    if (await this.checkSession(name)) {
      var key = await this.getSessionKey(name)
      delete this.session[key]
      return true
    }
    return false
  }

  // retornar sessão
  static async getSession(name) {
    if (await this.checkSession(name)) {
      var key = await this.getSessionKey(name);
      return this.session[key];
    }
    return false
  }

  // retornar todas
  static async getAll() {
    return this.session
  }

  // checa o client
  static async checkClient(name) {
    if (await this.getSession(name) && await this.getSession(name)?.client) {
      return true
    }
    return false
  }

  static async UrlToBase64(url) {
    return new Promise((resolve, reject) => {
      try {
        axios?.get(url, { responseType: 'arraybuffer' }).then(async (result) => {
          let buffer = Buffer?.from(result?.data)?.toString('base64');
          resolve(`data:${(await fromBuffer(result?.data))?.mime};base64,${buffer}`);
        })
      } catch (error) {
        console.log(error)
        reject(error)
      }
    })
  }

  static async fileToBase64(path) {
    return new Promise(async (resolve, reject) => {
      try {
        if (fs?.existsSync(path)) {
          const base64 = fs?.readFileSync(path, { encoding: 'base64' });
          let mime = mimeTypes?.lookup(path);
          if (!mime) {
            const result = await fileType?.fromFile(path);
            mime = result?.mime;
          }
          if (!mime) {
            mime = 'application/octet-stream';
          }
          const data = `data:${mime};base64,${base64}`;
          resolve(data);
        }
        else
          if (path?.data) {
            let buffer = await path?.data?.toString('base64')
            let mime = mimeTypes?.lookup(path?.name);
            const data = `data:${mime};base64,${buffer}`
            resolve(data);
          }
          else {
            resolve(false);
          }
      } catch (error) {
        console?.log(error)
        reject(error);
      }
    })
  }

  static async upToDate(local, remote) {
    const VPAT = /^\d+(\.\d+){0,2}$/;
    if (!local || !remote || local.length === 0 || remote.length === 0)
      return false;
    if (local == remote) return true;
    if (VPAT.test(local) && VPAT.test(remote)) {
      const lparts = local.split('.');
      while (lparts.length < 3) lparts.push('0');
      const rparts = remote.split('.');
      while (rparts.length < 3) rparts.push('0');
      for (let i = 0; i < 3; i++) {
        const l = parseInt(lparts[i], 10);
        const r = parseInt(rparts[i], 10);
        if (l === r) continue;
        return l > r;
      }
      return true;
    } else {
      return local >= remote;
    }
  }

  static async logUpdateAvailable(current, latest) {
    const newVersionLog =
      `Há uma nova versão da ${chalk.bold(`My Whatsapp`)} ${chalk.gray(current)} ➜  ${chalk.bold.green(latest)}\n` +
      `Atualize sua API executando:\n\n` +
      `${chalk.bold('\>')} ${chalk.blueBright('git pull && npm install')}`;
    console.log(boxen(newVersionLog, { padding: 1 }));
    console.log(
      `Para mais informações visite: ${chalk.underline(
        'https://github.com/AlanMartines/mywhatsapp-api-node-baileys-md/releases'
      )}\n`
    );
  }
}