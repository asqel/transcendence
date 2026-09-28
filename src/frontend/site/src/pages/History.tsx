import { useState, useEffect } from "react"
import { userApi, type HistoryResponse} from "../api";
import { useTranslation } from "react-i18next";

function History() {
    const {t} = useTranslation();

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);
    const [history, setHistory] = useState<HistoryResponse[]|null>(null);

    async function fetchHistory() {
        setLoading(true);
        try{
            const res = await userApi.get_history()
            setHistory(res)
        }
        catch {
            setError(true);
        }
        finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHistory();
    }, [])

    if (loading) {
        return (
            <div className="history-page">
                <p>{t("loading")}</p>
            </div>
        );
    }
    if (error) {
        return (
            <div className="history-page">
                <p>{t("error.default")}</p>
            </div>
        )
    }
    return (
        <div className="history-page">
            {history?.map((game, index) => (
                <p key={index}>{game.player1}, {game.player2}, {game.winner}, {game.date}</p>
            ))}
        </div>
    )
}
export default History