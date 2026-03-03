-- =============================================
-- PGA SCHEMA FOR GENOMA v2.0
-- =============================================

-- Create schema dedicated to PGA
CREATE SCHEMA IF NOT EXISTS pga;

-- ─── Tabla de Genomas ───────────────────────

CREATE TABLE IF NOT EXISTS pga.genomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    family_id UUID,
    version INTEGER DEFAULT 1,
    config JSONB NOT NULL DEFAULT '{}',
    state VARCHAR(50) DEFAULT 'active' CHECK (state IN ('active', 'quarantined', 'testing', 'archived', 'migrating')),
    tags TEXT[] DEFAULT '{}',
    
    -- Chromosomes (stored as JSONB)
    c0_data JSONB NOT NULL DEFAULT '{}',
    c1_data JSONB NOT NULL DEFAULT '{}',
    c2_data JSONB NOT NULL DEFAULT '{}',
    
    -- Integrity
    c0_hash VARCHAR(64),
    violations INTEGER DEFAULT 0,
    quarantined BOOLEAN DEFAULT FALSE,
    quarantine_reason TEXT,
    last_verified TIMESTAMP WITH TIME ZONE,
    
    -- Fitness
    fitness_accuracy DECIMAL(10,6) DEFAULT 0.5,
    fitness_speed DECIMAL(10,6) DEFAULT 0.5,
    fitness_cost DECIMAL(10,6) DEFAULT 0.5,
    fitness_safety DECIMAL(10,6) DEFAULT 0.5,
    fitness_satisfaction DECIMAL(10,6) DEFAULT 0.5,
    fitness_adaptability DECIMAL(10,6) DEFAULT 0.5,
    fitness_composite DECIMAL(10,6) DEFAULT 0.5,
    fitness_sample_size INTEGER DEFAULT 0,
    fitness_confidence DECIMAL(10,6) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_genomes_family ON pga.genomes(family_id);
CREATE INDEX IF NOT EXISTS idx_genomes_state ON pga.genomes(state);
CREATE INDEX IF NOT EXISTS idx_genomes_name ON pga.genomes(name);

-- ─── Tabla de Alelos/Genes ──────────────────

CREATE TABLE IF NOT EXISTS pga.genes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    genome_id UUID NOT NULL REFERENCES pga.genomes(id) ON DELETE CASCADE,
    layer INTEGER NOT NULL CHECK (layer IN (0, 1, 2)),
    
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    
    -- Fitness
    fitness_accuracy DECIMAL(10,6) DEFAULT 0.5,
    fitness_speed DECIMAL(10,6) DEFAULT 0.5,
    fitness_cost DECIMAL(10,6) DEFAULT 0.5,
    fitness_safety DECIMAL(10,6) DEFAULT 0.5,
    fitness_satisfaction DECIMAL(10,6) DEFAULT 0.5,
    fitness_adaptability DECIMAL(10,6) DEFAULT 0.5,
    fitness_composite DECIMAL(10,6) DEFAULT 0.5,
    
    -- Tracking
    usage_count INTEGER DEFAULT 0,
    success_rate DECIMAL(10,6) DEFAULT 0.5,
    last_used TIMESTAMP WITH TIME ZONE,
    
    -- Origin
    origin VARCHAR(50) DEFAULT 'initial' CHECK (origin IN ('initial', 'mutation', 'inheritance', 'manual')),
    source_gene_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_genes_genome ON pga.genes(genome_id);
CREATE INDEX IF NOT EXISTS idx_genes_category ON pga.genes(category);
CREATE INDEX IF NOT EXISTS idx_genes_fitness ON pga.genes(fitness_composite DESC);

-- ─── Tabla de Log de Mutaciones ─────────────

CREATE TABLE IF NOT EXISTS pga.mutation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    genome_id UUID NOT NULL REFERENCES pga.genomes(id) ON DELETE CASCADE,
    layer INTEGER NOT NULL,
    gene VARCHAR(255) NOT NULL,
    variant VARCHAR(255),
    mutation_type VARCHAR(100) NOT NULL,
    parent_variant VARCHAR(255),
    trigger_reason VARCHAR(100),
    deployed BOOLEAN DEFAULT FALSE,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mutation_logs_genome ON pga.mutation_logs(genome_id);
CREATE INDEX IF NOT EXISTS idx_mutation_logs_gene ON pga.mutation_logs(gene);
CREATE INDEX IF NOT EXISTS idx_mutation_logs_created ON pga.mutation_logs(created_at DESC);

-- ─── Tabla de DNA de Usuario ────────────────

CREATE TABLE IF NOT EXISTS pga.user_dna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    genome_id UUID NOT NULL REFERENCES pga.genomes(id) ON DELETE CASCADE,
    preferences JSONB DEFAULT '{}',
    learned_patterns JSONB DEFAULT '{}',
    interaction_count INTEGER DEFAULT 0,
    first_interaction TIMESTAMP WITH TIME ZONE,
    last_interaction TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, genome_id)
);

CREATE INDEX IF NOT EXISTS idx_user_dna_user ON pga.user_dna(user_id);
CREATE INDEX IF NOT EXISTS idx_user_dna_genome ON pga.user_dna(genome_id);

-- ─── Tabla de Hechos Semánticos ─────────────

CREATE TABLE IF NOT EXISTS pga.semantic_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    genome_id UUID NOT NULL REFERENCES pga.genomes(id) ON DELETE CASCADE,
    fact TEXT NOT NULL,
    category VARCHAR(100),
    confidence DECIMAL(3,2) DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    source VARCHAR(100),
    expires_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_semantic_facts_user ON pga.semantic_facts(user_id, genome_id);
CREATE INDEX IF NOT EXISTS idx_semantic_facts_category ON pga.semantic_facts(category);
CREATE INDEX IF NOT EXISTS idx_semantic_facts_expires ON pga.semantic_facts(expires_at) WHERE expires_at IS NOT NULL;

-- ─── Tabla de Interacciones ─────────────────

CREATE TABLE IF NOT EXISTS pga.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    genome_id UUID NOT NULL REFERENCES pga.genomes(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    user_message TEXT NOT NULL,
    assistant_response TEXT NOT NULL,
    tool_calls JSONB DEFAULT '[]',
    score DECIMAL(3,2) CHECK (score IS NULL OR (score >= 0 AND score <= 1)),
    tokens_used INTEGER,
    latency_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_interactions_genome_user ON pga.interactions(genome_id, user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_created ON pga.interactions(created_at DESC);

-- ─── Tabla de Feedback ──────────────────────

CREATE TABLE IF NOT EXISTS pga.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    genome_id UUID NOT NULL REFERENCES pga.genomes(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    gene VARCHAR(255) NOT NULL,
    sentiment VARCHAR(20) NOT NULL CHECK (sentiment IN ('positive', 'negative', 'neutral')),
    interaction_id UUID REFERENCES pga.interactions(id),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_genome ON pga.feedback(genome_id);
CREATE INDEX IF NOT EXISTS idx_feedback_gene ON pga.feedback(gene);

-- ─── Tabla de Gene Registry ─────────────────

CREATE TABLE IF NOT EXISTS pga.gene_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    
    -- Fitness
    fitness_composite DECIMAL(10,6) DEFAULT 0.5,
    
    -- Tracking
    usage_count INTEGER DEFAULT 0,
    source_genome_id UUID,
    source_genome_name VARCHAR(255),
    
    -- Status
    validated BOOLEAN DEFAULT FALSE,
    public BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gene_registry_category ON pga.gene_registry(category);
CREATE INDEX IF NOT EXISTS idx_gene_registry_fitness ON pga.gene_registry(fitness_composite DESC);
CREATE INDEX IF NOT EXISTS idx_gene_registry_public ON pga.gene_registry(public) WHERE public = TRUE;

-- ─── Función de Actualización de Timestamp ──

CREATE OR REPLACE FUNCTION pga.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trg_genomes_updated_at ON pga.genomes;
CREATE TRIGGER trg_genomes_updated_at
    BEFORE UPDATE ON pga.genomes
    FOR EACH ROW EXECUTE FUNCTION pga.update_updated_at();

DROP TRIGGER IF EXISTS trg_user_dna_updated_at ON pga.user_dna;
CREATE TRIGGER trg_user_dna_updated_at
    BEFORE UPDATE ON pga.user_dna
    FOR EACH ROW EXECUTE FUNCTION pga.update_updated_at();

DROP TRIGGER IF EXISTS trg_gene_registry_updated_at ON pga.gene_registry;
CREATE TRIGGER trg_gene_registry_updated_at
    BEFORE UPDATE ON pga.gene_registry
    FOR EACH ROW EXECUTE FUNCTION pga.update_updated_at();

-- ─── Vistas Útiles ──────────────────────────

CREATE OR REPLACE VIEW pga.v_gene_performance AS
SELECT 
    g.id as genome_id,
    g.name as genome_name,
    ge.category,
    ge.content,
    ge.fitness_composite,
    ge.usage_count,
    ge.origin
FROM pga.genomes g
JOIN pga.genes ge ON ge.genome_id = g.id
WHERE g.state = 'active'
ORDER BY ge.fitness_composite DESC;

CREATE OR REPLACE VIEW pga.v_mutation_activity AS
SELECT 
    DATE_TRUNC('day', created_at) as day,
    genome_id,
    mutation_type,
    COUNT(*) as mutation_count
FROM pga.mutation_logs
GROUP BY DATE_TRUNC('day', created_at), genome_id, mutation_type
ORDER BY day DESC;

CREATE OR REPLACE VIEW pga.v_genome_stats AS
SELECT 
    g.id,
    g.name,
    g.version,
    g.state,
    g.fitness_composite,
    (SELECT COUNT(*) FROM pga.genes WHERE genome_id = g.id) as total_genes,
    (SELECT COUNT(*) FROM pga.mutation_logs WHERE genome_id = g.id) as total_mutations,
    (SELECT COUNT(*) FROM pga.interactions WHERE genome_id = g.id) as total_interactions,
    (SELECT COUNT(DISTINCT user_id) FROM pga.user_dna WHERE genome_id = g.id) as total_users
FROM pga.genomes g;

-- ─── Grant Permissions (adjust as needed) ───
-- GRANT USAGE ON SCHEMA pga TO genoma_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA pga TO genoma_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA pga TO genoma_app;
