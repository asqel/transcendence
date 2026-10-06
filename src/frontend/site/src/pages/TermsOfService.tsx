import { useTranslation } from "react-i18next"
import { authApi } from "../api";

function TermeOfService() {
    const [t] = useTranslation();

    return (
        <div style={{width: "50dvw", marginLeft: "25%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center"}}>
            <h2>{t("terms-of-service.general_rule")}</h2>
            <p>{t("terms-of-service.general_rule_text")}</p>
            <h2>{t("terms-of-service.chat_rule")}</h2>
            <p>{t("terms-of-service.chat_rule_text")}</p>
            <h2>{t("terms-of-service.game_rule")}</h2>
            <p>{t("terms-of-service.game_rule_text")}</p>
            <h2>{t("terms-of-service.account_deletion")}</h2>
            <p>{t("terms-of-service.account_deletion_text")}</p>
        </div>
    )
}
export default TermeOfService