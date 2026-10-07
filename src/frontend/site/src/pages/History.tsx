import { useState, useEffect } from "react"
import { userApi, type HistoryResponse} from "../api";
import { useTranslation } from "react-i18next";
import "./History.css"

function History() {
    const {t} = useTranslation();

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);
    const [history, setHistory] = useState<HistoryResponse[]|null>(null);

    function formatGameDate(date: string) {
        return new Date(date).toLocaleString(t("date-lang"), {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function getWiner(game: HistoryResponse) {
        if (game.winner === 1)
            return game.player1;
        else if (game.winner === 2)
            return game.player2;
        return ("tie")
    }


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
                <p>{t("error.server")}</p>
            </div>
        )
    }
    return (
        <div className="history-page">
            <table className="history">
                {history ? (
                    <>
                        <tr>
                            <th>{t("history-page.player1")}</th>
                            <th>{t("history-page.player2")}</th>
                            <th>{t("history-page.winner")}</th>
                            <th>{t("history-page.date")}</th>
                        </tr>
                        {history?.map((game, index) => (
                            <tr key={index}>
                                <td>{game.player1}</td>
                                <td>{game.player2}</td>
                                <td>{getWiner(game)}</td>
                                <td>{formatGameDate(game.date)}</td>
                            </tr>
                        ))}
                    </>

                ):(
                    <p>{t("history-page.no_data")}</p>
                )}
            </table>
        </div>
    )
}
export default History