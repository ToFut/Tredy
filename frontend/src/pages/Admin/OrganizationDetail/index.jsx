import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Sidebar from "@/components/SettingsSidebar";
import showToast from "@/utils/toast";
import TredyAdmin from "@/models/tredyAdmin";

export default function OrganizationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState(null);
  const [users, setUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [skills, setSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [activeTab, setActiveTab] = useState("details");
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    try {
      const token = localStorage.getItem("anythingllm_authToken");

      // Fetch organization details
      const orgRes = await fetch(`/api/organizations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const orgData = await orgRes.json();

      if (orgData.success) {
        setOrganization(orgData.organization);
        setEditData({
          name: orgData.organization.name,
          tier: orgData.organization.tier,
          subscriptionTier: orgData.organization.subscriptionTier
        });
      } else {
        showToast(orgData.error || "Failed to load organization", "error");
        navigate("/settings/super-admin");
        return;
      }

      // Fetch users in organization
      const usersRes = await fetch(`/api/organizations/${id}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const usersData = await usersRes.json();
      if (usersData.success) {
        setUsers(usersData.users);
      }

      // Fetch all users (for adding to org)
      const allUsersRes = await fetch(`/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allUsersData = await allUsersRes.json();
      if (allUsersData.users) {
        setAllUsers(allUsersData.users.filter(u => u.organizationId !== parseInt(id)));
      }

      // Fetch organization purchases
      const purchasesRes = await fetch(`/api/organizations/${id}/purchases`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const purchasesData = await purchasesRes.json();
      if (purchasesData.success) {
        setPurchases(purchasesData.purchases);
      }
    } catch (error) {
      console.error("Failed to load organization:", error);
      showToast("Failed to load organization", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateOrg(e) {
    e.preventDefault();

    try {
      const res = await fetch(`/api/organizations/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("anythingllm_authToken")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(editData)
      });

      const result = await res.json();
      if (result.success) {
        showToast("Organization updated successfully", "success");
        setEditMode(false);
        fetchData();
      } else {
        showToast(result.error || "Failed to update organization", "error");
      }
    } catch (error) {
      console.error("Failed to update organization:", error);
      showToast("Failed to update organization", "error");
    }
  }

  async function handleAddUser(userId) {
    try {
      const res = await fetch(`/api/organizations/${id}/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("anythingllm_authToken")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ userId })
      });

      const result = await res.json();
      if (result.success) {
        showToast("User added to organization", "success");
        fetchData();
      } else {
        showToast(result.error || "Failed to add user", "error");
      }
    } catch (error) {
      console.error("Failed to add user:", error);
      showToast("Failed to add user", "error");
    }
  }

  async function handleRemoveUser(userId) {
    if (!confirm("Remove this user from the organization?")) return;

    try {
      const res = await fetch(`/api/organizations/${id}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("anythingllm_authToken")}`
        }
      });

      const result = await res.json();
      if (result.success) {
        showToast("User removed from organization", "success");
        fetchData();
      } else {
        showToast(result.error || "Failed to remove user", "error");
      }
    } catch (error) {
      console.error("Failed to remove user:", error);
      showToast("Failed to remove user", "error");
    }
  }

  if (loading) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-theme-bg-primary flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white text-lg">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-theme-bg-primary flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white text-lg">Organization not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-primary flex">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate("/settings/super-admin")}
              className="text-white/60 hover:text-white mb-2 flex items-center gap-2"
            >
              ← Back to Super Admin
            </button>
            <h1 className="text-3xl font-bold text-white">{organization.name}</h1>
            <p className="text-white/60 mt-1">ID: {organization.id} • Slug: {organization.slug}</p>
          </div>
          {!editMode && activeTab === "details" && (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Edit Organization
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-white/10">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "details"
                ? "text-white border-b-2 border-blue-500"
                : "text-white/60 hover:text-white"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "users"
                ? "text-white border-b-2 border-blue-500"
                : "text-white/60 hover:text-white"
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab("purchases")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "purchases"
                ? "text-white border-b-2 border-blue-500"
                : "text-white/60 hover:text-white"
            }`}
          >
            Purchases ({purchases.length})
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "analytics"
                ? "text-white border-b-2 border-blue-500"
                : "text-white/60 hover:text-white"
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "details" && (
          <DetailsTab
            organization={organization}
            editMode={editMode}
            editData={editData}
            setEditData={setEditData}
            onSave={handleUpdateOrg}
            onCancel={() => {
              setEditMode(false);
              setEditData({
                name: organization.name,
                tier: organization.tier,
                subscriptionTier: organization.subscriptionTier
              });
            }}
          />
        )}

        {activeTab === "users" && (
          <UsersTab
            users={users}
            allUsers={allUsers}
            onAddUser={handleAddUser}
            onRemoveUser={handleRemoveUser}
          />
        )}

        {activeTab === "purchases" && (
          <PurchasesTab purchases={purchases} />
        )}

        {activeTab === "analytics" && (
          <AnalyticsTab organization={organization} users={users} purchases={purchases} />
        )}
      </div>
    </div>
  );
}

function DetailsTab({ organization, editMode, editData, setEditData, onSave, onCancel }) {
  if (editMode) {
    return (
      <form onSubmit={onSave} className="bg-theme-bg-secondary rounded-lg p-6 max-w-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Edit Organization</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-white mb-2">Organization Name</label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full px-4 py-2 bg-theme-bg-primary text-white rounded-lg border border-white/10 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-white mb-2">Tier</label>
            <select
              value={editData.tier}
              onChange={(e) => setEditData({ ...editData, tier: e.target.value })}
              className="w-full px-4 py-2 bg-theme-bg-primary text-white rounded-lg border border-white/10 focus:border-blue-500 focus:outline-none"
            >
              <option value="internal">Internal</option>
              <option value="agency">Agency</option>
              <option value="startup">Startup</option>
            </select>
          </div>

          <div>
            <label className="block text-white mb-2">Subscription Tier</label>
            <select
              value={editData.subscriptionTier}
              onChange={(e) => setEditData({ ...editData, subscriptionTier: e.target.value })}
              className="w-full px-4 py-2 bg-theme-bg-primary text-white rounded-lg border border-white/10 focus:border-blue-500 focus:outline-none"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <div className="bg-theme-bg-secondary rounded-lg p-6 max-w-2xl">
      <h2 className="text-xl font-bold text-white mb-4">Organization Details</h2>

      <div className="space-y-4">
        <div>
          <p className="text-white/60 text-sm">Name</p>
          <p className="text-white text-lg">{organization.name}</p>
        </div>

        <div>
          <p className="text-white/60 text-sm">Slug</p>
          <p className="text-white">{organization.slug}</p>
        </div>

        <div>
          <p className="text-white/60 text-sm">Tier</p>
          <p className="text-white capitalize">{organization.tier}</p>
        </div>

        <div>
          <p className="text-white/60 text-sm">Subscription</p>
          <p className="text-white capitalize">{organization.subscriptionTier || "free"}</p>
        </div>

        {organization.stripeCustomerId && (
          <div>
            <p className="text-white/60 text-sm">Stripe Customer ID</p>
            <p className="text-white font-mono text-sm">{organization.stripeCustomerId}</p>
          </div>
        )}

        <div>
          <p className="text-white/60 text-sm">Created</p>
          <p className="text-white">{new Date(organization.createdAt).toLocaleString()}</p>
        </div>

        <div>
          <p className="text-white/60 text-sm">Last Updated</p>
          <p className="text-white">{new Date(organization.lastUpdatedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function UsersTab({ users, allUsers, onAddUser, onRemoveUser }) {
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  function handleAddUser(e) {
    e.preventDefault();
    if (!selectedUserId) return;
    onAddUser(parseInt(selectedUserId));
    setSelectedUserId("");
    setShowAddUser(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Organization Users</h2>
        {allUsers.length > 0 && (
          <button
            onClick={() => setShowAddUser(!showAddUser)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {showAddUser ? "Cancel" : "+ Add User"}
          </button>
        )}
      </div>

      {showAddUser && (
        <form onSubmit={handleAddUser} className="bg-theme-bg-secondary rounded-lg p-4">
          <label className="block text-white mb-2">Select User</label>
          <div className="flex gap-4">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 px-4 py-2 bg-theme-bg-primary text-white rounded-lg border border-white/10 focus:border-blue-500 focus:outline-none"
              required
            >
              <option value="">-- Select a user --</option>
              {allUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.username} ({user.role})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      )}

      {users.length === 0 ? (
        <div className="bg-theme-bg-secondary rounded-lg p-8 text-center">
          <p className="text-white/60">No users in this organization yet.</p>
        </div>
      ) : (
        <div className="bg-theme-bg-secondary rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-white font-medium">Username</th>
                <th className="px-6 py-3 text-left text-white font-medium">Role</th>
                <th className="px-6 py-3 text-left text-white font-medium">Joined</th>
                <th className="px-6 py-3 text-right text-white font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5">
                  <td className="px-6 py-4 text-white">{user.username}</td>
                  <td className="px-6 py-4 text-white capitalize">{user.role}</td>
                  <td className="px-6 py-4 text-white/60">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onRemoveUser(user.id)}
                      className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PurchasesTab({ purchases }) {
  if (purchases.length === 0) {
    return (
      <div className="bg-theme-bg-secondary rounded-lg p-8 text-center">
        <p className="text-white/60">No purchases yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Purchase History</h2>

      <div className="bg-theme-bg-secondary rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-left text-white font-medium">Item</th>
              <th className="px-6 py-3 text-left text-white font-medium">Type</th>
              <th className="px-6 py-3 text-left text-white font-medium">Amount</th>
              <th className="px-6 py-3 text-left text-white font-medium">Date</th>
              <th className="px-6 py-3 text-left text-white font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {purchases.map((purchase) => (
              <tr key={purchase.id} className="hover:bg-white/5">
                <td className="px-6 py-4 text-white">{purchase.hubId}</td>
                <td className="px-6 py-4 text-white capitalize">
                  {purchase.itemType.replace("-", " ")}
                </td>
                <td className="px-6 py-4 text-white">
                  ${((purchase.amountPaidCents || 0) / 100).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-white/60">
                  {new Date(purchase.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    purchase.status === "completed"
                      ? "bg-green-600/20 text-green-400"
                      : "bg-yellow-600/20 text-yellow-400"
                  }`}>
                    {purchase.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsTab({ organization, users, purchases }) {
  const totalRevenue = purchases.reduce((sum, p) => sum + (p.amountPaidCents || 0), 0);
  const completedPurchases = purchases.filter(p => p.status === "completed").length;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">Analytics</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-theme-bg-secondary rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Total Users</p>
          <p className="text-3xl font-bold text-white">{users.length}</p>
        </div>

        <div className="bg-theme-bg-secondary rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Total Purchases</p>
          <p className="text-3xl font-bold text-white">{completedPurchases}</p>
        </div>

        <div className="bg-theme-bg-secondary rounded-lg p-6">
          <p className="text-white/60 text-sm mb-2">Total Revenue</p>
          <p className="text-3xl font-bold text-white">${(totalRevenue / 100).toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-theme-bg-secondary rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Organization Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/60 text-sm">Tier</p>
            <p className="text-white capitalize">{organization.tier}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Subscription</p>
            <p className="text-white capitalize">{organization.subscriptionTier || "free"}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Created</p>
            <p className="text-white">{new Date(organization.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-white/60 text-sm">Last Updated</p>
            <p className="text-white">{new Date(organization.lastUpdatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
