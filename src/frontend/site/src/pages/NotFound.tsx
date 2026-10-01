import { useTranslation } from "react-i18next"

function NotFound() {
  const [t] = useTranslation()
  return <h1 style={{textAlign: "center"}}>{t("404")}</h1>
}
export default NotFound