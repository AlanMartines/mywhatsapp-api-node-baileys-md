const fse = require('fs-extra'); // Usando fs-extra
const yaml = require('js-yaml');
const { exec } = require('child_process');
const swaggerSpec = require('./swagger.js');

// Função para executar o comando swagger-codegen-cli
function generateSwaggerCode() {
    const command = 'swagger-codegen-cli generate -i swagger.yaml -l nodejs-server -o newiu';

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro ao executar o comando: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Erro: ${stderr}`);
            return;
        }
        console.log(`Resultado: ${stdout}`);
    });
}

// Verifique se o arquivo swagger.yaml já existe e remova-o antes de criar um novo
fse.pathExists('swagger.yaml')
    .then(exists => {
        if (exists) {
            return fse.remove('swagger.yaml');
        }
    })
    .then(() => {
        const yamlSpec = yaml.dump(swaggerSpec);
        return fse.writeFile('swagger.yaml', yamlSpec, 'utf8');
    })
    .then(() => {
        // Chame a função para gerar o código
        generateSwaggerCode();
    })
    .catch(err => {
        console.error(`Erro ao manipular o arquivo: ${err.message}`);
    });