<div align="center">

<img src="icon/IMG_3094.PNG" alt="Genome Logo" width="200"/>

# Genome

### Agente Inteligente Autoevolutivo

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org)

**Un agente de IA que aprende, muta y mejora solo — como el ADN.**

Created by **Luis Alfredo Velasquez Duran**

[Inicio Rapido](#-inicio-rapido) · [Interfaz Web](#-interfaz-web) · [GSEP](#-gsep---genomic-self-evolving-prompts) · [Extensiones](#-extensiones) · [Arquitectura](#-arquitectura) · [Contribuir](#-contribuir)

</div>

---

## Que es Genome?

**Genome** es un agente de IA autoevolutivo y gateway multi-canal de codigo abierto. Conecta multiples plataformas de mensajeria con proveedores de IA y evoluciona sus propios prompts automaticamente para mejorar con cada interaccion.

|    Prompt Estatico     |      Genome (Autoevolutivo)       |
| :--------------------: | :-------------------------------: |
|   Rigido y obsoleto    |         Vivo y adaptativo         |
| Mismo texto para todos |      Modular y personalizado      |
|      Sin memoria       | Memoria que mejora con cada tarea |
|         Manual         |        Autoajuste continuo        |
|      Tokens fijos      |  Compresion evolutiva de tokens   |

---

## Inicio Rapido

### Para Usuarios

```bash
# Instalacion interactiva
npx genoma-setup

# O instalacion rapida con OpenAI
npx genoma-setup --quick --provider openai
```

### Para Desarrolladores

```bash
# Clonar el repositorio
git clone https://github.com/LuisvelMarketer/genome.git
cd genome

# Instalar dependencias
pnpm install

# Configurar
cp .env.example .env
nano .env  # Agregar tus API keys

# Iniciar en modo desarrollo
pnpm dev
```

### Con Docker

```bash
docker build -t genome .
docker run -d --name genome \
  -v $(pwd)/.env:/app/.env \
  -p 3000:3000 \
  genome
```

> Para instrucciones detalladas de instalacion, configuracion de canales y solucion de problemas, consulta la [Guia de Instalacion](INSTALL.md).

---

## Interfaz Web

Genome incluye un panel de control web completo para interactuar con el agente y gestionar todos los servicios.

```bash
cd ui
pnpm install
pnpm dev
# Acceder en http://localhost:5173
```

### Funcionalidades

| Modulo            | Descripcion                                                   |
| :---------------- | :------------------------------------------------------------ |
| **Chat**          | Interfaz de conversacion en tiempo real con streaming         |
| **Canales**       | Gestion de integraciones (Telegram, Discord, WhatsApp, etc.)  |
| **Agentes**       | Configuracion de agentes, tools, skills y cron jobs           |
| **Sesiones**      | Historial y gestion de sesiones de usuario                    |
| **Uso**           | Metricas y analiticas de consumo                              |
| **Configuracion** | Ajustes del sistema con validacion de formularios             |
| **Cron**          | Programacion de tareas automaticas con historial de ejecucion |
| **Logs**          | Visor de eventos con filtros en tiempo real                   |
| **Debug**         | Utilidades de depuracion e invocacion de metodos              |

### Idiomas Soportados

English, Deutsch, Portugues (BR), Chino Simplificado, Chino Tradicional

### Stack Tecnologico

Construido con [Lit](https://lit.dev/) (Web Components), [Vite](https://vitejs.dev/) y TypeScript.

---

## GSEP - Genomic Self-Evolving Prompts

El corazon de Genome. Un sistema de evolucion genomica que optimiza prompts automaticamente.
Powered by [`@gsep/core`](https://github.com/gsepcore/gsep).

### Arquitectura de 5 Cromosomas

```
┌──────────────────────────────────────────────────────────┐
│                       GSEP Genome                         │
├──────────────────────────────────────────────────────────┤
│  C0 (Inmutable)    │ Identidad, etica, seguridad (SHA-256)│
│  C1 (Operativo)    │ Genes mutables con fitness 6D        │
│  C2 (Epigenetico)  │ Adaptaciones por usuario             │
│  C3 (Firewall)     │ Defensa de input (57 patrones)       │
│  C4 (Inmune)       │ Deteccion de output infectado        │
└──────────────────────────────────────────────────────────┘
```

### Integracion

Genome usa GSEP via middleware — dos hooks que envuelven tu agente:

```typescript
import { GSEPMiddleware } from "@gsep/core";

const mw = await GSEPMiddleware.create({
  llm: myLLMAdapter,
  name: "genome-agent",
});

// Antes de ejecutar el agente
const { prompt, rejected } = await mw.before(systemPrompt, {
  message: userMessage,
  userId: "user-123",
});

// Despues de ejecutar
await mw.after(response, { userId: "user-123", feedback: score });
```

> Documentacion completa: [gsepcore.com](https://gsepcore.com)

---

## Extensiones

### Canales de Mensajeria (42+)

| Categoria       | Plataformas                                             |
| :-------------- | :------------------------------------------------------ |
| **Chat**        | WhatsApp, Telegram, Discord, Slack, Signal, Matrix, IRC |
| **Empresarial** | Microsoft Teams, Google Chat, Mattermost, Feishu        |
| **Social**      | Twitch, Line, Nostr                                     |
| **Otros**       | iMessage, BlueBubbles, Synology Chat, Nextcloud Talk    |

### Skills Integrados (54+)

| Categoria         | Skills                                                       |
| :---------------- | :----------------------------------------------------------- |
| **Productividad** | Notion, Linear, Todoist, Airtable                            |
| **Multimedia**    | Spotify, YouTube                                             |
| **Desarrollo**    | GitHub, GitLab                                               |
| **Hogar**         | Home Assistant                                               |
| **Utilidades**    | Busqueda web, generacion de imagenes, analisis de documentos |

### Proveedores de IA

- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)
- Google (Gemini)
- Modelos locales via Ollama
- Azure OpenAI
- DeepSeek, Mistral, y mas

---

## Arquitectura

```
Genome/
├── src/
│   ├── gsep/                   # GSEP integration (via @gsep/core middleware)
│   ├── security/               # Prompt injection guard, canary tokens, output scanner
│   ├── commands/               # Comandos CLI
│   ├── hooks/                  # Sistema de hooks
│   └── ...
├── ui/                         # Panel de control web (Lit + Vite)
│   └── src/
│       ├── ui/                 # Componentes: chat, canales, agentes, config
│       └── i18n/               # Traducciones (en, de, pt-BR, zh-CN, zh-TW)
├── extensions/                 # 42+ extensiones de mensajeria
├── apps/                       # Apps nativas (iOS, Android, macOS)
└── docs/                       # Documentacion
```

### Seguridad

Genome viene **seguro por defecto**. No necesitas configurar nada extra para usarlo en tu PC personal.

**Red y acceso:**

| Proteccion       | Default                                              |
| :--------------- | :--------------------------------------------------- |
| Gateway bind     | `127.0.0.1` — solo accesible desde tu maquina        |
| Auth token       | Auto-generado (48 bytes aleatorios) en cada arranque |
| Canales          | Deshabilitados hasta que agregas tus tokens          |
| Telegram/Discord | Usan polling saliente, no abren puertos entrantes    |

**Prompt Injection Protection (5 capas):**

| Capa | Componente               | Funcion                                                                                                                                                                                                             |
| :--- | :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1    | **PromptInjectionGuard** | 77 patrones regex en modo `strict`, 15 tipos de inyeccion incluyendo skeleton_key, named_jailbreak (STAN/AIM/DAN), many_shot, inyeccion multilenguaje (9 idiomas), indirect injection, crescendo y encoding evasion |
| 2    | **Inbound Scanner**      | Escaneo de cada mensaje entrante en gateway y canales (Telegram, Discord, Slack, etc.) antes de llegar al LLM                                                                                                       |
| 3    | **Canary Tokens**        | Token unico por sesion embebido en el system prompt; si aparece en la respuesta del LLM, se detecta y redacta automaticamente                                                                                       |
| 4    | **Output Scanner**       | Escaneo de respuestas del LLM antes de entregarlas al usuario — detecta fragments del system prompt, canary leaks e injection echoes                                                                                |
| 5    | **Rate Limiter**         | Sliding-window por sender (5 intentos/min, lockout de 10 min) para frenar ataques repetidos                                                                                                                         |

**GSEP (evolucion de prompts):**

- **Sistema Inmune**: Auto-rollback cuando un gen tiene rendimiento degradado
- **MutationEvaluator**: Sandbox testing de mutaciones antes del deploy
- **GenomeKernel**: Proteccion criptografica SHA-256 del cromosoma inmutable (C0)

---

## Configuracion

### Variables de Entorno

```env
# Proveedor de IA (requerido)
OPENAI_API_KEY=sk-...
# O usa otro proveedor
ANTHROPIC_API_KEY=sk-ant-...

# Extensiones (opcional)
TELEGRAM_BOT_TOKEN=...
DISCORD_BOT_TOKEN=...
WHATSAPP_PHONE_NUMBER=...
```

### GSEP Config

```env
# Enable genomic self-evolution
GSEP_ENABLED=true
GSEP_AUTO_MUTATION=true
GSEP_AUTO_ROLLBACK=true
GSEP_STORAGE_TYPE=database
```

> Full GSEP configuration: see [`@gsep/core` docs](https://github.com/gsepcore/gsep)

---

## Roadmap

### v1.0 - Base

- [x] Gateway multi-canal
- [x] 42+ extensiones de mensajeria
- [x] 54+ skills integrados
- [x] Browser automation con Playwright

### v2.0 - Evolution

- [x] Sistema de evolucion genomica (legacy PGA, now migrating to GSEP)
- [x] Evolucion y aprendizaje automatico
- [x] Registro genomico de agentes

### v3.0 - Seguridad

- [x] Sistema Inmune con auto-rollback
- [x] MutationEvaluator con sandbox
- [x] Prompt Injection Guard (77 patrones, 15 tipos, modo strict)
- [x] Inbound scanner conectado al pipeline (gateway + canales)
- [x] Canary tokens por sesion con deteccion de fuga
- [x] Output scanner (system prompt fragments, injection echoes)
- [x] Rate limiter de inyeccion por sender

### v4.0 - Optimizacion (Actual)

- [x] Compresion evolutiva de tokens
- [x] Presupuesto de tokens con ranking por eficiencia
- [x] Compresion eager al inicializar
- [x] Estrategia `compress` en MutationOperator
- [ ] Instalador npm profesional (`npm create genome`)
- [ ] Wizard de configuracion interactivo

---

## Contribuir

Las contribuciones son bienvenidas! Lee la [guia de contribucion](CONTRIBUTING.md) antes de enviar un PR.

```bash
git checkout -b feature/mi-feature
git commit -m 'Add: mi nueva feature'
git push origin feature/mi-feature
# Abre un Pull Request
```

---

## Licencia

MIT License - Copyright (c) 2026 Luis Alfredo Velasquez Duran

Ver [LICENSE](LICENSE) para detalles.

---

<div align="center">

**Genome** — _Agentes que nunca se vuelven obsoletos_

Created by Luis Alfredo Velasquez Duran

[Volver arriba](#)

</div>
