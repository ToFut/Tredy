import ConnectorImages from "@/components/DataConnectorOption/media";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import GithubOptions from "./Connectors/Github";
import GitlabOptions from "./Connectors/Gitlab";
import YoutubeOptions from "./Connectors/Youtube";
import ConfluenceOptions from "./Connectors/Confluence";
import DrupalWikiOptions from "./Connectors/DrupalWiki";
import { useState } from "react";
import ConnectorOption from "./ConnectorOption";
import WebsiteDepthOptions from "./Connectors/WebsiteDepth";
import ObsidianOptions from "./Connectors/Obsidian";

export const getDataConnectors = (t) => ({
  github: {
    name: t("connectors.github.name"),
    image: ConnectorImages.github,
    description: t("connectors.github.description"),
    options: <GithubOptions />,
  },
  gitlab: {
    name: t("connectors.gitlab.name"),
    image: ConnectorImages.gitlab,
    description: t("connectors.gitlab.description"),
    options: <GitlabOptions />,
  },
  "youtube-transcript": {
    name: t("connectors.youtube.name"),
    image: ConnectorImages.youtube,
    description: t("connectors.youtube.description"),
    options: <YoutubeOptions />,
  },
  "website-depth": {
    name: t("connectors.website-depth.name"),
    image: ConnectorImages.websiteDepth,
    description: t("connectors.website-depth.description"),
    options: <WebsiteDepthOptions />,
  },
  confluence: {
    name: t("connectors.confluence.name"),
    image: ConnectorImages.confluence,
    description: t("connectors.confluence.description"),
    options: <ConfluenceOptions />,
  },
  drupalwiki: {
    name: "Drupal Wiki",
    image: ConnectorImages.drupalwiki,
    description: "Import Drupal Wiki spaces in a single click.",
    options: <DrupalWikiOptions />,
  },
  obsidian: {
    name: "Obsidian",
    image: ConnectorImages.obsidian,
    description: "Import Obsidian vault in a single click.",
    options: <ObsidianOptions />,
  },
});

export default function DataConnectors() {
  const { t } = useTranslation();
  const [selectedConnector, setSelectedConnector] = useState("github");
  const [searchQuery, setSearchQuery] = useState("");
  const DATA_CONNECTORS = getDataConnectors(t);

  const filteredConnectors = Object.keys(DATA_CONNECTORS).filter((slug) =>
    DATA_CONNECTORS[slug].name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[80vh] w-[80vw] max-w-6xl bg-white dark:bg-gray-900 rounded-xl shadow-xl">
      {/* Left Panel - Connector List */}
      <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Data Connectors
        </h2>

        {/* Search */}
        <div className="relative mb-6">
          <MagnifyingGlass
            size={16}
            weight="bold"
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder={t("connectors.search-placeholder")}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Connector List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredConnectors.length > 0 ? (
            filteredConnectors.map((slug, index) => (
              <ConnectorOption
                key={index}
                slug={slug}
                selectedConnector={selectedConnector}
                setSelectedConnector={setSelectedConnector}
                image={DATA_CONNECTORS[slug].image}
                name={DATA_CONNECTORS[slug].name}
                description={DATA_CONNECTORS[slug].description}
              />
            ))
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              {t("connectors.no-connectors")}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Configuration */}
      <div className="w-1/2 p-6">
        <div className="h-full flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <img
              src={DATA_CONNECTORS[selectedConnector].image}
              alt={DATA_CONNECTORS[selectedConnector].name}
              className="w-10 h-10 rounded-lg"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {DATA_CONNECTORS[selectedConnector].name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {DATA_CONNECTORS[selectedConnector].description}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {DATA_CONNECTORS[selectedConnector].options}
          </div>
        </div>
      </div>
    </div>
  );
}
