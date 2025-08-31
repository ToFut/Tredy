import useLoginMode from "@/hooks/useLoginMode";
import usePfp from "@/hooks/usePfp";
import useUser from "@/hooks/useUser";
import System from "@/models/system";
import paths from "@/utils/paths";
import { userFromStorage } from "@/utils/request";
import { Person } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import AccountModal from "../AccountModal";
import { AUTH_TIMESTAMP, AUTH_TOKEN, AUTH_USER } from "@/utils/constants";
import { useTranslation } from "react-i18next";
import { supabase } from "@/utils/supabase";
import { useContext } from "react";
import { AuthContext } from "@/AuthContext";

export default function UserButton() {
  const { t } = useTranslation();
  const mode = useLoginMode();
  const { user } = useUser();
  const { actions } = useContext(AuthContext);
  const menuRef = useRef();
  const buttonRef = useRef();
  const [showMenu, setShowMenu] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [supportEmail, setSupportEmail] = useState("");

  const handleClose = (event) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target) &&
      !buttonRef.current.contains(event.target)
    ) {
      setShowMenu(false);
    }
  };

  const handleOpenAccountModal = () => {
    setShowAccountSettings(true);
    setShowMenu(false);
  };

  useEffect(() => {
    if (showMenu) {
      document.addEventListener("mousedown", handleClose);
    }
    return () => document.removeEventListener("mousedown", handleClose);
  }, [showMenu]);

  useEffect(() => {
    const fetchSupportEmail = async () => {
      const supportEmail = await System.fetchSupportEmail();
      setSupportEmail(
        supportEmail?.email
          ? `mailto:${supportEmail.email}`
          : paths.mailToMintplex()
      );
    };
    fetchSupportEmail();
  }, []);

  if (mode === null) return null;
  return (
    <div className="absolute top-3 right-4 md:top-9 md:right-10 w-fit h-fit z-40">
      <button
        ref={buttonRef}
        onClick={() => setShowMenu(!showMenu)}
        type="button"
        className="uppercase transition-all duration-300 w-[35px] h-[35px] text-base font-semibold rounded-full flex items-center bg-theme-action-menu-bg hover:bg-theme-action-menu-item-hover justify-center text-white p-2 hover:border-slate-100 hover:border-opacity-50 border-transparent border"
      >
        {mode === "multi" ? <UserDisplay /> : <Person size={14} />}
      </button>

      {showMenu && (
        <div
          ref={menuRef}
          className="w-fit rounded-lg absolute top-12 right-0 bg-theme-action-menu-bg p-2 flex items-center-justify-center"
        >
          <div className="flex flex-col gap-y-2">
            {mode === "multi" && !!user && (
              <button
                onClick={handleOpenAccountModal}
                className="border-none text-white hover:bg-theme-action-menu-item-hover w-full text-left px-4 py-1.5 rounded-md"
              >
                {t("profile_settings.account")}
              </button>
            )}
            <a
              href={supportEmail}
              className="text-white hover:bg-theme-action-menu-item-hover w-full text-left px-4 py-1.5 rounded-md"
            >
              {t("profile_settings.support")}
            </a>
            <button
              onClick={async () => {
                console.log('[LOGOUT] Starting logout...');
                
                // For Supabase users, sign out from Supabase first
                const user = userFromStorage();
                if (user?.supabaseId) {
                  console.log('[LOGOUT] Signing out from Supabase...');
                  await supabase.auth.signOut();
                  console.log('[LOGOUT] Supabase signout complete');
                }
                
                // Clear ALL possible auth storage
                console.log('[LOGOUT] Clearing all storage...');
                window.localStorage.clear();
                window.sessionStorage.clear();
                
                // Clear IndexedDB (where Supabase might store data)
                if (window.indexedDB) {
                  const databases = await window.indexedDB.databases();
                  databases.forEach(db => {
                    if (db.name && db.name.includes('supabase')) {
                      window.indexedDB.deleteDatabase(db.name);
                    }
                  });
                }
                
                console.log('[LOGOUT] Redirecting...');
                window.location.replace('/login');
              }}
              type="button"
              className="text-white hover:bg-theme-action-menu-item-hover w-full text-left px-4 py-1.5 rounded-md"
            >
              {t("profile_settings.signout")}
            </button>
          </div>
        </div>
      )}
      {user && showAccountSettings && (
        <AccountModal
          user={user}
          hideModal={() => setShowAccountSettings(false)}
        />
      )}
    </div>
  );
}

function UserDisplay() {
  const { pfp } = usePfp();
  const user = userFromStorage();

  if (pfp) {
    return (
      <div className="w-[35px] h-[35px] rounded-full flex-shrink-0 overflow-hidden transition-all duration-300 bg-gray-100 hover:border-slate-100 hover:border-opacity-50 border-transparent border hover:opacity-60">
        <img
          src={pfp}
          alt="User profile picture"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return user?.username?.slice(0, 2) || "AA";
}
