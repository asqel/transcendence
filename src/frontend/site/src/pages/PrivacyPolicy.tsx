import { useTranslation } from "react-i18next"

function PrivacyPolicy() {
    const [t] = useTranslation();

    return (
        <div style={{display: "flex", flexDirection: "column", alignItems: "center"}}>
                <h2>{t("privacy-policy.data_collection")}</h2>
                <p>{t("privacy-policy.data_collection_text")}</p>
                <h2>{t("privacy-policy.data_usage")}</h2>
                <p>{t("privacy-policy.data_usage_text")}</p>
                <h2>{t("privacy-policy.data_accebility")}</h2>
                <p>{t("privacy-policy.data_accebility_text")}</p>
                <h2>{t("privacy-policy.data_location")}</h2>
                <p>{t("privacy-policy.data_collection_text")}</p>
                <h2>{t("privacy-policy.data_deletion")}</h2>
                <p>{t("privacy-policy.data_deletion_text")}</p>
                <h2>{t("privacy-policy.data_sharing")}</h2>
                <p>{t("privacy-policy.data_sharing_text")}</p>
        </div>
    )
}
export default PrivacyPolicy