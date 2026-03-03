const fs = require('fs-extra');
const { fromBuffer } = require('file-type');
const mimeTypes = require('mime-types');
const fileType = require('file-type');
const axios = require('axios');
const chalk = require('chalk');
const boxen = require('boxen');

module.exports = class Sessions {

  static session = new Map();

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
    try {
      if (await this.isURL(path)) {
        await axios.head(path);
        return true;
      }
      return fs.existsSync(path);
    } catch {
      return false;
    }
  }

  static async sleep(ms) {
    let time = parseInt(ms) | 1
    return new Promise(resolve => setTimeout(resolve, time));
  }

  // checar ou adiciona um usuario na sessão
  static async checkAddUser(name) {
    if (!this.session.has(name)) {
      const add = {
        SessionName: name,
      };
      this.session.set(name, add);
      return true;
    }
    return false;
  }

  // checar se exite o usuario na sessão
  static async checkSession(name) {
    return this.session.has(name);
  }

  // adicionar informações a sessão 
  static async addInfoSession(name, extend) {
    if (this.session.has(name)) {
      const currentSession = this.session.get(name);
      Object.assign(currentSession, extend);
      return true;
    }
    return false;
  }

  // Remove object na sessão
  static async removeInfoObjects(name, key) {
    if (this.session.has(name)) {
      const currentSession = this.session.get(name);
      delete currentSession[key];
      return true;
    }
    return false;
  }

  // deletar sessão
  static async deleteSession(name) {
    return this.session.delete(name);
  }

  // retornar sessão
  static async getSession(name) {
    return this.session.get(name) || false;
  }

  // retornar todas
  static async getAll() {
    return Array.from(this.session.values());
  }

  // checa o client
  static async checkClient(name) {
    const session = this.session.get(name);
    if (session && session.client) {
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