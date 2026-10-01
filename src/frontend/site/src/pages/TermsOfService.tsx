import { useTranslation } from "react-i18next"

function TermeOfService() {
    const [t] = useTranslation();

    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
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