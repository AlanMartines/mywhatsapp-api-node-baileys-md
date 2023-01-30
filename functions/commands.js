module.exports = class Command {
	//
	// ------------------------------------------------------------------------------------------------//
	//
	static async deletaArquivosTemp(filePath) {
		//
		const cacheExists = await fs.pathExists(filePath);
		if (cacheExists) {
			fs.remove(filePath);
			console?.log(`- O arquivo "${filePath}" removido`);
		}
		//
	}
	//
	// ------------------------------------------------------------------------------------------------//
	//
	static async soNumeros(string) {
		var numbers = string.replace(/[^0-9]/g, '');
		return numbers;
	}
	//
	// ------------------------------------------------------------------------------------------------//
	//
	static async removeWithspace(string) {
		var string = string.replace(/\r?\n|\r|\s+/g, ""); /* replace all newlines and with a space */
		return string;
	}
	//
	// ------------------------------------------------------------------------------------------------//
	//
	static async validPhone(phone) {
		// A função abaixo demonstra o uso de uma expressão regular que identifica, de forma simples, telefones válidos no Brasil.
		// Nenhum DDD iniciado por 0 é aceito, e nenhum número de telefone pode iniciar com 0 ou 1.
		// Exemplos válidos: +55 (11) 98888-8888 / 9999-9999 / 21 98888-8888 / 5511988888888
		//
		var isValid = /^(?:(?:\+|00)?(55)\s?)?(?:\(?([1-9][0-9])\)?\s?)?(?:((?:9\d|[2-9])\d{3})\-?(\d{4}))$/
		return isValid.test(phone);
	}
	//
	// ------------------------------------------------------------------------------------------------//
	//
	static async validInternationalPhoneNumber(phone) {
		var regex = /^\+(?:[0-9] ?){6,14}[0-9]$/;
		if (regex.test(phone)) {
			return true;
		} else {
			return false;
		}
	}
	//
	// ------------------------------------------------------------------------------------------------//
	//
	static async convertBytes(bytes) {
		const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
		if (bytes == 0) {
			return "n/a"
		}
		const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
		if (i == 0) {
			return bytes + " " + sizes[i]
		}
		return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i]
	}
	//
	// ------------------------------------------------------------------------------------------------//
	//
	static async osplatform() {
	//
	var opsys = process.platform;
	if (opsys == "darwin") {
		opsys = "MacOS";
	} else if (opsys == "win32" || opsys == "win64") {
		opsys = "Windows";
	} else if (opsys == "linux") {
		opsys = "Linux";
	}
	//
	console.log("- Sistema operacional", opsys) // I don't know what linux is.
	console.log("-", os.type());
	console.log("-", os.release());
	console.log("-", os.platform());
	//
	return opsys;
}
//
// ------------------------------------------------------------------------------------------------//
//
}