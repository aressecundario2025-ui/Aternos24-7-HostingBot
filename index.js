'use strict';
const mineflayer = require('mineflayer');
const { pathfinder } = require('mineflayer-pathfinder');
const config = require('./settings.json');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 5000;

let bot = null;
let botState = { connected: false, startTime: Date.now(), reconnectAttempts: 0 };

app.get('/', (req, res) => {
  res.send(`<h1>${config.name} Dashboard</h1><p>Status: ${botState.connected ? 'Online' : 'Connecting...'}</p>`);
});

app.get('/health', (req, res) => {
  res.json({
    status: botState.connected ? 'connected' : 'disconnected',
    uptime: Math.floor((Date.now() - botState.startTime) / 1000),
    coords: bot && bot.entity ? bot.entity.position : null
  });
});

function initBot() {
  if (bot) { try { bot.quit(); } catch(e){} }

  bot = mineflayer.createBot({
    host: config.server.ip,
    port: parseInt(config.server.port),
    username: config["bot-account"].username,
    version: config.server.version || false,
    auth: config["bot-account"].type
  });

  bot.loadPlugin(pathfinder);

  bot.on('login', () => {
    botState.connected = true;
    console.log("Bot conectado con éxito.");
  });

  // ==========================================
  // CONFIGURACIÓN DE TUS COMANDOS DE JUEGO
  // ==========================================
  // !!! REEMPLAZA "TuNombreDeUsuario" con tu nick real de Minecraft !!!
  const MASTER_PLAYER = "ZerroNova26"; 

  bot.on('chat', (username, message) => {
    if (username !== MASTER_PLAYER) return;

    if (message === '!ir') {
      const target = bot.players[username]?.entity;
      if (target) {
        bot.lookAt(target.position.offset(0, 1.6, 0));
        bot.setControlState('forward', true);
        bot.chat("¡Voy hacia ti!");
        setTimeout(() => bot.setControlState('forward', false), 3000);
      } else {
        bot.chat("No te veo desde aquí.");
      }
    }

    if (message === '!saltar') {
      bot.chat("¡Saltando!");
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 500);
    }

    if (message.startsWith('!decir ')) {
      const texto = message.replace('!decir ', '');
      bot.chat(texto);
    }
  });

  bot.on('end', () => {
    botState.connected = false;
    console.log("El bot se desconectó. Reintentando en 5 segundos...");
    setTimeout(initBot, 5000);
  });

  bot.on('error', (err) => {
    console.log("Error interno del bot:", err.message);
  });
}

app.listen(PORT, () => {
  console.log(`Servidor web activo en el puerto ${PORT}`);
  initBot();
});
