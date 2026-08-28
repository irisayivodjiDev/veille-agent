import TelegramBot from 'node-telegram-bot-api';
import { runQualifier } from '../Agents/Qualifier/Qualifier.mts';
import { createSource } from '../db/repository.mts';

const URL_REGEX = /^https?:\/\/\S+$/i;

export function startTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN absent : le bot Telegram ne démarre pas (capture via formulaire web toujours disponible)');
    return null;
  }

  const bot = new TelegramBot(token, { polling: true });

  bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    if (!text) {
      await bot.sendMessage(chatId, "Pour l'instant j'accepte uniquement du texte ou un lien. 🎙️ Le dictaphone terrain arrive plus tard.");
      return;
    }

    const isUrl = URL_REGEX.test(text);
    const source = createSource({
      channel: 'telegram',
      raw_type: isUrl ? 'url' : 'text',
      ...(isUrl ? { raw_url: text } : { raw_text: text }),
    });

    await bot.sendMessage(chatId, `📥 Source #${source.id} capturée. Qualification en cours...`);

    try {
      const result = await runQualifier(source.id);
      if (result.error) {
        await bot.sendMessage(chatId, `❌ Échec de la qualification : ${result.error}`);
        return;
      }
      await bot.sendMessage(chatId, `✅ Article #${result.articleId} qualifié et rangé. Va voir l'app pour les détails et les tags.`);
    } catch (err) {
      console.error('❌ Erreur pipeline Qualifier (Telegram):', err);
      await bot.sendMessage(chatId, `❌ Erreur pendant le traitement : ${(err as Error).message}`);
    }
  });

  bot.on('polling_error', (err) => {
    console.error('❌ Erreur polling Telegram:', err.message);
  });

  console.log('🤖 Bot Telegram connecté (polling)');
  return bot;
}
