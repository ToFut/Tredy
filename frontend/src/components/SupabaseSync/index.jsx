import React, { useState } from 'react';
import { CloudArrowDown, Spinner } from '@phosphor-icons/react';
import showToast from '@/utils/toast';
import { Nango } from '@nangohq/frontend';

const SupabaseSync = ({ workspace, item, className = "" }) => {
  const [syncing, setSyncing] = useState(false);
  const [nango] = useState(() => new Nango({
    host: process.env.REACT_APP_NANGO_HOST || 'https://api.nango.dev'
  }));

  const syncToSupabase = async () => {
    setSyncing(true);

    try {
      // Step 1: Get Google Drive file content via Nango
      const connectionId = `workspace_${workspace.id}`;
      const providerConfigKey = 'google-drive';

      // Check if we have a Google Drive connection
      try {
        await nango.getConnection(providerConfigKey, connectionId);
      } catch (error) {
        showToast('No Google Drive connection found. Please connect Google Drive first.', 'error');
        setSyncing(false);
        return;
      }

      // Step 2: Get file metadata and content
      let fileContent = '';
      let fileMetadata = {};

      if (item.gdriveId) {
        // If we have Google Drive ID, fetch from there
        try {
          // Get file metadata
          const metadataResponse = await fetch(`/api/gdrive/file/${item.gdriveId}/metadata`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'X-Workspace-Id': workspace.id
            }
          });

          if (metadataResponse.ok) {
            fileMetadata = await metadataResponse.json();
          }

          // Get file content
          const contentResponse = await fetch(`/api/gdrive/file/${item.gdriveId}/content`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'X-Workspace-Id': workspace.id
            }
          });

          if (contentResponse.ok) {
            fileContent = await contentResponse.text();
          } else {
            throw new Error('Failed to fetch file content');
          }
        } catch (error) {
          showToast(`Error fetching Google Drive content: ${error.message}`, 'error');
          setSyncing(false);
          return;
        }
      } else {
        // Search for file by name first
        try {
          const searchResponse = await fetch(`/api/gdrive/search?fileName=${encodeURIComponent(item.name)}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
              'X-Workspace-Id': workspace.id
            }
          });

          if (searchResponse.ok) {
            const searchResults = await searchResponse.json();
            if (searchResults.files && searchResults.files.length > 0) {
              const foundFile = searchResults.files[0];

              // Get content of found file
              const contentResponse = await fetch(`/api/gdrive/file/${foundFile.id}/content`, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                  'X-Workspace-Id': workspace.id
                }
              });

              if (contentResponse.ok) {
                fileContent = await contentResponse.text();
                fileMetadata = foundFile;
              }
            } else {
              showToast(`File "${item.name}" not found in Google Drive`, 'warning');
              setSyncing(false);
              return;
            }
          }
        } catch (error) {
          showToast(`Error searching Google Drive: ${error.message}`, 'error');
          setSyncing(false);
          return;
        }
      }

      // Step 3: Sync to Supabase
      const syncResponse = await fetch(`/api/workspace/${workspace.slug}/sync-to-supabase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          title: fileMetadata.name || item.name,
          content: fileContent,
          metadata: {
            ...fileMetadata,
            original_file: item.name,
            sync_source: 'google_drive',
            sync_date: new Date().toISOString(),
            workspace_id: workspace.id,
            gdrive_file_id: fileMetadata.id || item.gdriveId
          },
          workspaceId: workspace.id
        })
      });

      if (syncResponse.ok) {
        const result = await syncResponse.json();
        showToast(`Successfully synced "${item.name}" to Supabase!`, 'success');

        // Optional: Trigger workspace refresh
        if (window.dispatchEvent) {
          window.dispatchEvent(new CustomEvent('supabase_sync_complete', {
            detail: { file: item.name, result }
          }));
        }
      } else {
        const error = await syncResponse.json();
        throw new Error(error.message || 'Sync failed');
      }

    } catch (error) {
      console.error('Sync error:', error);
      showToast(`Sync failed: ${error.message}`, 'error');
    } finally {
      setSyncing(false);
    }
  };

  if (!item.canSync && !item.gdriveId) {
    return null;
  }

  return (
    <div
      onClick={syncToSupabase}
      className={`cursor-pointer ml-2 p-1 rounded hover:bg-theme-sidebar-item-hover transition-colors ${className}`}
      data-tooltip-id="supabase-sync"
      data-tooltip-content={syncing ? "Syncing to Supabase..." : "Sync to Supabase database"}
    >
      {syncing ? (
        <Spinner
          size={16}
          className="animate-spin text-blue-500"
        />
      ) : (
        <CloudArrowDown
          size={16}
          weight="regular"
          className="text-blue-500 hover:text-blue-600"
        />
      )}
    </div>
  );
};

export default SupabaseSync;