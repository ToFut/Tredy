import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const UserConnector = {
  list: async function () {
    return fetch(`${API_BASE}/user/connectors`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error);
        return res.connectors || [];
      })
      .catch((e) => {
        console.error(e);
        return [];
      });
  },

  getAvailable: async function () {
    return fetch(`${API_BASE}/user/connectors/available`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error);
        return res.connectors || [];
      })
      .catch((e) => {
        console.error(e);
        return [];
      });
  },

  create: async function ({ provider, nangoConnectionId, metadata = {} }) {
    return fetch(`${API_BASE}/user/connectors`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({
        provider,
        nangoConnectionId,
        metadata,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error);
        return res.connector;
      })
      .catch((e) => {
        console.error(e);
        throw e;
      });
  },

  delete: async function (provider) {
    return fetch(`${API_BASE}/user/connectors/${provider}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error);
        return res;
      })
      .catch((e) => {
        console.error(e);
        throw e;
      });
  },

  sync: async function (provider) {
    return fetch(`${API_BASE}/user/connectors/${provider}/sync`, {
      method: "POST",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error);
        return res;
      })
      .catch((e) => {
        console.error(e);
        throw e;
      });
  },

  initOAuth: async function (provider) {
    return fetch(`${API_BASE}/user/connectors/connect`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({ provider }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error);
        return res;
      })
      .catch((e) => {
        console.error(e);
        throw e;
      });
  },

  handleOAuthCallback: async function ({ provider, code, state }) {
    return fetch(`${API_BASE}/user/connectors/oauth/callback`, {
      method: "POST",
      headers: baseHeaders(),
      body: JSON.stringify({
        provider,
        code,
        state,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (!res.success) throw new Error(res.error);
        return res.connector;
      })
      .catch((e) => {
        console.error(e);
        throw e;
      });
  },
};

export default UserConnector;