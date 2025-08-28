// Arquivo: scripts/backup-scheduler.ts

import cron from 'node-cron';
import { exec } from 'child_process'; // Para executar comandos do sistema
import { PrismaClient } from '@prisma/client';

// Inicializa o cliente do Prisma DENTRO do script
const prisma = new PrismaClient();

console.log('Serviço de agendamento de backup iniciado.');
console.log('Aguardando a hora agendada para executar o backup...');

// Agenda a tarefa para rodar todos os dias às 2:00 da manhã
// A string '0 2 * * *' é a sintaxe do cron: (minuto hora dia-do-mês mês dia-da-semana)
cron.schedule('0 2 * * *', () => {
  console.log('INICIANDO ROTINA DE BACKUP AGENDADA...');

  // **IMPORTANTE**: Altere este comando para o comando real do banco de dados
  // Exemplo para PostgreSQL:
  const backupCommand = 'PGPASSWORD=941848 pg_dump -U postgres -h localhost -p 5432 -d projetoerp > C:/Users/kyerzin/Documents/Backups/backup.sql';
  // Lembrar de substituir o usuário, host, porta, db e caminho do arquivo de backup.

  exec(backupCommand, async (error, stdout, stderr) => {
    if (error) {
      console.error(`ERRO ao executar o backup: ${error.message}`);
      return;
    }
    if (stderr) {
      // stderr pode conter mensagens de aviso que não são erros fatais, então apenas registramos.
      console.warn(`Stderr do backup: ${stderr}`);
    }

    console.log('BACKUP REALIZADO COM SUCESSO!');

    // Agora, salve a data e hora do sucesso no banco de dados
    const now = new Date();
    try {
      // Usamos 'upsert' que cria o registro se não existir, ou atualiza se já existir.
      await prisma.systemSettings.upsert({
        where: { key: 'lastBackup' },
        update: { value: now.toISOString() },
        create: { key: 'lastBackup', value: now.toISOString() },
      });
      console.log('Data do último backup foi atualizada no banco de dados.');
    } catch (dbError) {
      console.error('ERRO ao salvar a data do backup no banco de dados:', dbError);
    }
  });
}, {
  timezone: "America/Sao_Paulo" // fuso horario
});