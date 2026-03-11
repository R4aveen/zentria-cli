#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

meow(
	`
	Usage
	  $ zentria-cli

	Options
		--name  Your name

	Examples
	  $ zentria-cli --name=Jane
	  Hello, Jane
`,
	{
		importMeta: import.meta,
		flags: {
			name: {
				type: 'string',
			},
		},
	},
);

// Establecer título de la ventana de terminal
process.stdout.write('\x1b]0;Zentria CLI\x07');

// Entrar al alternate screen buffer para evitar scroll y artefactos al redimensionar
process.stdout.write('\x1b[?1049h\x1b[2J\x1b[H');

const instance = render(<App />);

instance.waitUntilExit().then(() => {
	process.stdout.write('\x1b[?1049l');
});

// Restaurar buffer original al cerrar
process.on('exit', () => {
	process.stdout.write('\x1b[?1049l');
});
