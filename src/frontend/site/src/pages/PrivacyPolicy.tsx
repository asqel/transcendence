import { useTranslation } from "react-i18next"

function PrivacyPolicy() {
    const [t] = useTranslation();

    return (
        <div style={{width: "50dvw", marginLeft: "25%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center"}}>
            <h2>{t("privacy-policy.datacollection")}</h2>
            <p>{t("privacy-policy.datacollection_text")}</p>
            <h2>{t("privacy-policy.datausage")}</h2>
            <p>{t("privacy-policy.datausage_text")}</p>
            <h2>{t("privacy-policy.dataaccebility")}</h2>
            <p>{t("privacy-policy.dataaccebility_text")}</p>
            <h2>{t("privacy-policy.datalocation")}</h2>
            <p>{t("privacy-policy.datalocation_text")}</p>
            <h2>{t("privacy-policy.datadeletion")}</h2>
            <p>{t("privacy-policy.datadeletion_text")}</p>
            <h2>{t("privacy-policy.datasharing")}</h2>
            <p>{t("privacy-policy.datasharing_text")}</p>
            <h2>{t("privacy-policy.legalbasis")}</h2>
            <p>{t("privacy-policy.legalbasis_text")}</p>
            <h2>{t("privacy-policy.dataretention")}</h2>
            <p>{t("privacy-policy.dataretention_text")}</p>
            <h2>{t("privacy-policy.userrights")}</h2>
            <p>{t("privacy-policy.userrights_text")}</p>
            <h2>{t("privacy-policy.contact")}</h2>
            <p>{t("privacy-policy.contact_text")}</p>
        </div>
    )
}
export default PrivacyPolicy