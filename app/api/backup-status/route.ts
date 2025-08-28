// Arquivo: app/api/backup-status/route.ts
// VERSÃO FINAL CORRIGIDA

import { NextResponse } from 'next/server';

// A FORMA CORRETA E DEFINITIVA DE CARREGAR O PRISMA
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Função que já está funcionando para calcular a data
function getNextBackupTime(): Date {
  const now = new Date();
  const nextBackup = new Date();
  
  nextBackup.setHours(2, 0, 0, 0);

  if (now.getTime() > nextBackup.getTime()) {
    nextBackup.setDate(nextBackup.getDate() + 1);
  }

  return nextBackup;
}


export async function GET() {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'lastBackup' },
    });
    const lastBackup = setting ? setting.value : 'Nunca';

    const nextBackupDate = getNextBackupTime();

    return NextResponse.json({ 
      lastBackup,
      nextBackup: nextBackupDate.toISOString()
    });

  } catch (error) {
    if (error instanceof Error) {
      console.error("Erro detalhado na API:", {
        message: error.message,
        stack: error.stack,
      });
    } else {
      console.error("Um erro desconhecido ocorreu na API:", error);
    }
    
    return NextResponse.json(
        { error: 'Erro interno ao processar a solicitação' }, 
        { status: 500 }
    );
  }
}