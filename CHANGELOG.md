# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [2.0.0] - 2026-03-03

### 🧬 PGA - Prompt Genómico Autoevolutivo

Nueva plataforma completa de evolución genómica para agentes de IA.

#### Added

**Core Genómico**
- `GenomeV2`: Estructura genómica de 3 cromosomas (C0, C1, C2)
- `GenomeKernel`: Protección criptográfica SHA-256 para C0 inmutable
- `GenomeManager`: CRUD y gestión del ciclo de vida de genomas
- `FitnessTracker`: Sistema de evaluación 6D con métricas multidimensionales
- `PromptAssembler`: Ensamblador de prompts con selección epsilon-greedy
- `GeneRegistry`: Repositorio central de genes compartidos

**Sistema de Evolución**
- `MutationOperator`: Estrategias de mutación (LLM rewrite, parameter tweak, simplify)
- Auto-mutation basada en umbrales de fitness
- Sistema de rollback automático con snapshots

**Memoria y Adaptación**
- `LayeredMemory`: Memoria semántica por usuario con expiración
- Epigenoma de usuario (C2) para preferencias personalizadas
- Patrones contextuales aprendidos

**Integración No Invasiva**
- `GenomaAgentPGABridge`: Bridge singleton para integración con agentes
- `AgentIntegration`: Wrapper completo para agentes existentes
- `PGAAPI`: API simplificada para operaciones comunes
- `PGAHooks`: Hooks modulares (beforeAgentStart, afterAgentComplete, etc.)

**Infraestructura**
- `GenomaStorageAdapter`: Adaptador de storage in-memory
- `GenomaLLMAdapter`: Adaptador LLM mock para desarrollo
- `PGALogger`: Sistema de logging estructurado
- `PGARollbackManager`: Gestión de snapshots y rollbacks
- `PGAMetricsCollector`: Colector de métricas de evolución
- `Evaluator`: Evaluación heurística y LLM-as-judge

**Configuración**
- `pga-integration.config.ts`: Configuración centralizada con feature flags
- Configuraciones por entorno (development, production, testing)
- Pesos configurables para métricas 6D

**Base de Datos**
- Schema PostgreSQL completo (`src/pga/database/schema.sql`)
- Tablas: genomes, genes, mutation_logs, user_dna, semantic_facts, interactions
- Vistas analíticas: v_gene_performance, v_mutation_activity, v_genome_stats

**Tipos TypeScript**
- Tipos completos para GenomeV2 y sus componentes
- Interfaces para StorageAdapter y LLMAdapter
- Tipos de integración Genoma-PGA

#### Changed
- README.md actualizado con documentación de PGA
- Estructura de proyecto expandida con módulo `/src/pga/`

#### Technical Details
- Arquitectura modular con exports centralizados via index.ts
- Compatibilidad ESM con extensiones .js en imports
- Integración no invasiva que preserva funcionalidad existente

---

## [1.0.0] - 2026-02-01

### Initial Release

Fork de OpenClaw con adaptaciones para Genoma.

#### Added
- 42+ extensiones de mensajería
- 54+ skills integrados
- Browser automation con Playwright
- Terminal execution
- Soporte multi-proveedor de IA (OpenAI, Anthropic, Google, Ollama)
- Sistema de extensiones modular
- Configuración por variables de entorno

#### Based On
- OpenClaw (MIT License) por Peter Steinberger y contribuidores
