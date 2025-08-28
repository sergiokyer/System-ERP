"use strict";
// Arquivo: scripts/backup-scheduler.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var node_cron_1 = require("node-cron");
var child_process_1 = require("child_process"); // Para executar comandos do sistema
var client_1 = require("@prisma/client");
// Inicializa o cliente do Prisma DENTRO do script
var prisma = new client_1.PrismaClient();
console.log('Serviço de agendamento de backup iniciado.');
console.log('Aguardando a hora agendada para executar o backup...');
// Agenda a tarefa para rodar todos os dias às 2:00 da manhã
// A string '0 2 * * *' é a sintaxe do cron: (minuto hora dia-do-mês mês dia-da-semana)
node_cron_1.default.schedule('0 * * * *', function () {
    console.log('INICIANDO ROTINA DE BACKUP AGENDADA...');
    // **IMPORTANTE**: Altere este comando para o comando real do banco de dados
    // Exemplo para PostgreSQL:
    var backupCommand = 'PGPASSWORD=941848 pg_dump -U postgres -h localhost -p 5432 -d projetoerp > C:/Users/kyerzin/Documents/Backups/backup.sql';
    // Lembrar de substituir o usuário, host, porta, db e caminho do arquivo de backup.
    (0, child_process_1.exec)(backupCommand, function (error, stdout, stderr) { return __awaiter(void 0, void 0, void 0, function () {
        var now, dbError_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (error) {
                        console.error("ERRO ao executar o backup: ".concat(error.message));
                        return [2 /*return*/];
                    }
                    if (stderr) {
                        // stderr pode conter mensagens de aviso que não são erros fatais, então apenas registramos.
                        console.warn("Stderr do backup: ".concat(stderr));
                    }
                    console.log('BACKUP REALIZADO COM SUCESSO!');
                    now = new Date();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    // Usamos 'upsert' que cria o registro se não existir, ou atualiza se já existir.
                    return [4 /*yield*/, prisma.systemSettings.upsert({
                            where: { key: 'lastBackup' },
                            update: { value: now.toISOString() },
                            create: { key: 'lastBackup', value: now.toISOString() },
                        })];
                case 2:
                    // Usamos 'upsert' que cria o registro se não existir, ou atualiza se já existir.
                    _a.sent();
                    console.log('Data do último backup foi atualizada no banco de dados.');
                    return [3 /*break*/, 4];
                case 3:
                    dbError_1 = _a.sent();
                    console.error('ERRO ao salvar a data do backup no banco de dados:', dbError_1);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); });
}, {
    timezone: "America/Sao_Paulo" // fuso horario
});
