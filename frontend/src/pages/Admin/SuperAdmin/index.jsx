import React, { useState, useEffect } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import Admin from "@/models/admin";
import showToast from "@/utils/toast";

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [showCreateOrg, setShowCreateOrg] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      // Fetch analytics
      const analyticsRes = await fetch("/api/super-admin/analytics", {
        headers: { Authorization: `Bearer ${localStorage.getItem("anythingllm_authToken")}` }
      });
      const analyticsData = await analyticsRes.json();
      if (analyticsData.success) {
        setAnalytics(analyticsData.analytics);
      }

      // Fetch organizations (if in multi-tenant mode)
      const orgsRes = await fetch("/api/organizations", {
        headers: { Authorization: `Bearer ${localStorage.getItem("anythingllm_authToken")}` }
      });
      const orgsData = await orgsRes.json();
      if (orgsData.success) {
        setOrganizations(orgsData.organizations);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      showToast("Failed to load dashboard data", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateOrg(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
      name: form.orgName.value,
      tier: form.tier.value,
      subscriptionTier: form.subscriptionTier.value
    };

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("anythingllm_authToken")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      if (result.success) {
        showToast("Organization created successfully", "success");
        setShowCreateOrg(false);
        fetchData();
        form.reset();
      } else {
        showToast(result.error || "Failed to create organization", "error");
      }
    } catch (error) {
      console.error("Failed to create organization:", error);
      showToast("Failed to create organization", "error");
    }
  }

  if (loading) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-sidebar flex">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-sidebar flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-main-gradient w-full h-full overflow-y-scroll"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white border-b-2 border-opacity-10">
            <div className="items-center flex gap-x-4">
              <p className="text-lg leading-6 font-bold text-white">
                Super Admin Dashboard
              </p>
            </div>
            <p className="text-xs leading-[18px] font-base text-white text-opacity-60">
              Platform analytics and management
            </p>
          </div>

          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <StatCard
                title="Total Users"
                value={analytics.totalUsers}
                icon="👥"
              />
              <StatCard
                title="Total Workspaces"
                value={analytics.totalWorkspaces}
                icon="💼"
              />
              <StatCard
                title="Total Purchases"
                value={analytics.totalPurchases}
                icon="🛒"
              />
              <StatCard
                title="Total Revenue"
                value={`$${(analytics.totalRevenueCents / 100).toFixed(2)}`}
                icon="💰"
              />
            </div>
          )}

          {/* Organizations Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Organizations</h2>
              <button
                onClick={() => setShowCreateOrg(!showCreateOrg)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                {showCreateOrg ? "Cancel" : "+ Create Organization"}
              </button>
            </div>

            {/* Create Org Form */}
            {showCreateOrg && (
              <form
                onSubmit={handleCreateOrg}
                className="bg-white bg-opacity-10 rounded-lg p-6 mb-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white text-sm mb-2">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      name="orgName"
                      required
                      className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg"
                      placeholder="Acme Corp"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm mb-2">
                      Tier
                    </label>
                    <select
                      name="tier"
                      className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg"
                    >
                      <option value="internal">Internal</option>
                      <option value="agency">Agency</option>
                      <option value="startup">Startup</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-white text-sm mb-2">
                      Subscription
                    </label>
                    <select
                      name="subscriptionTier"
                      className="w-full px-3 py-2 bg-zinc-900 text-white rounded-lg"
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Create Organization
                </button>
              </form>
            )}

            {/* Organizations List */}
            <div className="grid grid-cols-1 gap-4">
              {organizations.length === 0 ? (
                <p className="text-white text-opacity-60 text-center py-8">
                  No organizations yet. Enable TENANCY_MODE=multi to use this feature.
                </p>
              ) : (
                organizations.map((org) => (
                  <OrgCard key={org.id} org={org} onRefresh={fetchData} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <div className="bg-white bg-opacity-10 rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-opacity-60 text-sm">{title}</p>
          <p className="text-white text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}

function OrgCard({ org, onRefresh }) {
  return (
    <div className="bg-white bg-opacity-10 rounded-lg p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-white text-lg font-bold">{org.name}</h3>
          <p className="text-white text-opacity-60 text-sm">Slug: {org.slug}</p>
          <div className="flex gap-4 mt-2">
            <span className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
              {org.tier}
            </span>
            <span className="px-3 py-1 bg-green-600 text-white text-xs rounded-full">
              {org.subscriptionTier}
            </span>
          </div>
          <div className="mt-4 text-sm text-white text-opacity-60">
            <p>Users: {org._count?.users || 0}</p>
            <p>Purchases: {org._count?.marketplace_purchases || 0}</p>
          </div>
        </div>
        <button
          onClick={() => window.location.href = `/settings/organizations/${org.id}`}
          className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-colors"
        >
          Manage →
        </button>
      </div>
    </div>
  );
}
