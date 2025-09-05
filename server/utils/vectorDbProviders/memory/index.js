// Simple in-memory vector database for fallback when LanceDB is not available
const { v4: uuidv4 } = require("uuid");

class InMemoryVectorDB {
  constructor() {
    this.namespaces = new Map();
    this.name = "InMemoryVectorDB";
  }

  async connect() {
    return { client: this };
  }

  async heartbeat() {
    return { heartbeat: Number(new Date()) };
  }

  async totalVectors() {
    let total = 0;
    for (const namespace of this.namespaces.values()) {
      total += namespace.vectors.length;
    }
    return total;
  }

  async namespaceCount(namespace) {
    const ns = this.namespaces.get(namespace);
    return ns ? ns.vectors.length : 0;
  }

  async similarityResponse(namespace, query, similarityThreshold = 0.25, topN = 4) {
    const ns = this.namespaces.get(namespace);
    if (!ns) return [];

    // Simple similarity: return random vectors for now
    // In production, you'd calculate actual cosine similarity
    const results = ns.vectors
      .slice(0, topN)
      .map(vec => ({
        ...vec,
        score: Math.random() * 0.5 + 0.5 // Random score between 0.5 and 1
      }));

    return results;
  }

  async namespace(name) {
    if (!this.namespaces.has(name)) {
      this.namespaces.set(name, {
        name,
        vectors: []
      });
    }
    return this.namespaces.get(name);
  }

  async hasNamespace(name) {
    return this.namespaces.has(name);
  }

  async namespaceExists(client, name) {
    return this.namespaces.has(name);
  }

  async deleteVectorsInNamespace(namespace) {
    if (this.namespaces.has(namespace)) {
      this.namespaces.get(namespace).vectors = [];
    }
  }

  async deleteDocumentFromNamespace(namespace, docId) {
    const ns = this.namespaces.get(namespace);
    if (ns) {
      ns.vectors = ns.vectors.filter(v => v.docId !== docId);
    }
  }

  async addDocumentToNamespace(namespace, documentData, fullFilePath) {
    const ns = await this.namespace(namespace);
    
    // Store document chunks
    const vectors = documentData.map(item => ({
      id: uuidv4(),
      docId: fullFilePath,
      text: item.text,
      metadata: item.metadata || {},
      embedding: new Array(1536).fill(0) // Dummy embedding
    }));

    ns.vectors.push(...vectors);
    return { vectorized: true };
  }

  async updateOrCreateCollection(client, name, dimensions = 1536) {
    return await this.namespace(name);
  }

  distanceToSimilarity(distance) {
    return 1 - distance;
  }
}

// Singleton instance
let instance = null;

const MemoryVectorDB = {
  name: "InMemoryVectorDB",
  
  connect: async function() {
    if (!instance) {
      instance = new InMemoryVectorDB();
    }
    return instance.connect();
  },

  heartbeat: async function() {
    if (!instance) instance = new InMemoryVectorDB();
    return instance.heartbeat();
  },

  totalVectors: async function() {
    if (!instance) instance = new InMemoryVectorDB();
    return instance.totalVectors();
  },

  namespaceCount: async function(namespace) {
    if (!instance) instance = new InMemoryVectorDB();
    return instance.namespaceCount(namespace);
  },

  similarityResponse: async function(namespace, query, similarityThreshold, topN) {
    if (!instance) instance = new InMemoryVectorDB();
    return instance.similarityResponse(namespace, query, similarityThreshold, topN);
  },

  namespace: async function(name) {
    if (!instance) instance = new InMemoryVectorDB();
    return instance.namespace(name);
  },

  hasNamespace: async function(name) {
    if (!instance) instance = new InMemoryVectorDB();
    return instance.hasNamespace(name);
  },

  namespaceExists: async function(client, name) {
    if (!instance) instance = new InMemoryVectorDB();
    return instance.namespaceExists(client, name);
  },

  deleteVectorsInNamespace: async function(namespace) {
    if (!instance) instance = new InMemoryVectorDB();
    return instance.deleteVectorsInNamespace(namespace);
  },

  deleteDocumentFromNamespace: async function(namespace, docId) {
    if (!instance) instance = new InMemoryVectorDB();
    return instance.deleteDocumentFromNamespace(namespace, docId);
  },

  addDocumentToNamespace: async function(namespace, documentData, fullFilePath) {
    if (!instance) instance = new InMemoryVectorDB();
    return instance.addDocumentToNamespace(namespace, documentData, fullFilePath);
  },

  updateOrCreateCollection: async function(client, name, dimensions) {
    if (!instance) instance = new InMemoryVectorDB();
    return instance.updateOrCreateCollection(client, name, dimensions);
  },

  distanceToSimilarity: function(distance) {
    if (!instance) instance = new InMemoryVectorDB();
    return instance.distanceToSimilarity(distance);
  }
};

module.exports = { MemoryVectorDB };