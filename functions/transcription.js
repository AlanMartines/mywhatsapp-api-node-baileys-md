const path = require('path');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
const fs = require('fs-extra');
const { tmpdir } = require('os');
const mime = require('mime-types');
const { IamAuthenticator } = require('ibm-watson/auth');
const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');
const config = require('../config.global');
const credentials = {
  "apikey": "",
  "iam_apikey_description": "",
  "iam_apikey_name": "",
  "iam_role_crn": "crn:v1:bluemix:public:iam::::serviceRole:Manager",
  "iam_serviceid_crn": "",
  "url": ""
};

module.exports = class transcription {

	static async transAudio(contentType, base64Data) {
		console?.log('- Transcrevendo audio');
		try {
			const uid = require('crypto').randomBytes(64).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
			const ext = mime.extension(contentType);
			const audio = `${tmpdir}/${uid}.${ext}`;
			//
			await fs.writeFile(audio, base64Data, 'base64', function (err) {
				console?.log(err);
			});
				//
				const speechToText = new SpeechToTextV1({
					authenticator: new IamAuthenticator({
						apikey: credentials?.apikey,
					}),
					serviceUrl: credentials?.url,
				});
				//
				const params = {
					objectMode: false,
					contentType: contentType,
					model: 'pt-BR_BroadbandModel',
					keywords: [],
					keywordsThreshold: 0.5,
					maxAlternatives: 3,
				};
				// Create the stream.
				const recognizeStream = await speechToText.recognizeUsingWebSocket(params);
				// Pipe in the audio.
				await fs.createReadStream(audio).pipe(recognizeStream);
				/*
				 * Uncomment the following two lines of code ONLY if `objectMode` is `false`.
				 *
				 * WHEN USED TOGETHER, the two lines pipe the final transcript to the named
				 * file and produce it on the console.
				 *
				 * WHEN USED ALONE, the following line pipes just the final transcript to
				 * the named file but produces numeric values rather than strings on the
				 * console.
				 */
				await recognizeStream.pipe(fs.createWriteStream('./transcription.txt'));
				/*
				 * WHEN USED ALONE, the following line produces just the final transcript
				 * on the console.
				 */
				recognizeStream.setEncoding('utf8');
				// Listen for events.
				recognizeStream.on('data', async function (event) {
					await onEvent('- Data:', event);
				});
				recognizeStream.on('error', async function (event) {
					await onEvent('- Error:', event);
				});
				recognizeStream.on('close', async function (event) {
					await onEvent('- Close:', event);
				});
			// Display events on the console.
			async function onEvent(name, event) {
				console?.log(name, JSON.stringify(event, null, 2));
			};
			//
		} catch (error) {
			console?.log(error);
		}
		//
	}


	static async transVideo(contentType, buffer) {



		const video = path.join(__dirname, '../Roteiro.mp3');
		const audio = path.join(__dirname, '../Roteiro.mp3');
		console?.log('Criando o arquivo audio', audio);
		extractAudio().then(() => {
			console?.log('- Iniciando a transcrição');
			speechToText();
		}).catch((e) => {
			console.log('erro:', e)
		});

		async function extractAudio() {
			return new Promise((resolve, reject) => {
				try {
					const command = ffmpeg(video);

					command.format('mp3').save(audio).on('end', () => {
						console?.log('Processamento Finalizado');
						resolve(audio);
					});


				} catch (error) {
					reject(error);
				}
			});
		}

		async function speechToText() {
			const speechToText = new SpeechToTextV1({
				authenticator: new IamAuthenticator({
					apikey: credentials?.apikey,
				}),
				serviceUrl: credentials?.url,
			});

			const params = {
				objectMode: false,
				contentType: 'audio/mp3',
				model: 'pt-BR_BroadbandModel',
				keywords: [],
				keywordsThreshold: 0.5,
				maxAlternatives: 3,
			};

			// Create the stream.
			const recognizeStream = speechToText.recognizeUsingWebSocket(params);

			// Pipe in the audio.
			fs.createReadStream(audio).pipe(recognizeStream);

			/*
			 * Uncomment the following two lines of code ONLY if `objectMode` is `false`.
			 *
			 * WHEN USED TOGETHER, the two lines pipe the final transcript to the named
			 * file and produce it on the console.
			 *
			 * WHEN USED ALONE, the following line pipes just the final transcript to
			 * the named file but produces numeric values rather than strings on the
			 * console.
			 */
			recognizeStream.pipe(fs.createWriteStream('./transcription.txt'));

			/*
			 * WHEN USED ALONE, the following line produces just the final transcript
			 * on the console.
			 */
			recognizeStream.setEncoding('utf8');

			// Listen for events.
			recognizeStream.on('data', function (event) {
				onEvent('Data:', event);
			});
			recognizeStream.on('error', function (event) {
				onEvent('Error:', event);
			});
			recognizeStream.on('close', function (event) {
				onEvent('Close:', event);
			});
		}


		// Display events on the console.
		function onEvent(name, event) {
			console.log(name, JSON.stringify(event, null, 2));
		};

	}
}