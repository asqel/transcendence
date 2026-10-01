import { useEffect, useState } from "react";
import { globalApi, type LeaderboardResponse} from "../api";
import { useTranslation } from "react-i18next";
import "./Leaderboard.css"

function Leaderboard() {
    const [t] = useTranslation()
    const [loading, setLoading] = useState<boolean>(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardResponse|null>(null);
    const [error, setError] = useState<boolean>(false);

    async function fetchHistory() {
        setLoading(true);
        try{
            const res = await globalApi.get_leaderboard()
             setLeaderboard(res)
             console.log(res);
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
            <div>Loading</div>   
        )
    }
    if (error) {
        return (
            <div>error</div>   
        )
    }
    return (
        <div className="leaderboard-page">
            <table className="leaderboard">
                <tr>
                    <th>{t("leaderboard-page.rank")}</th>
                    <th>{t("leaderboard-page.player")}</th>
                    <th>{t("leaderboard-page.elo")}</th>
                </tr>
                {leaderboard?.board.map((player, index) => (
                    <tr key={index}>
                        <td>#{index + 1}</td>
                        <td>{player[0]}</td>
                        <td>{player[1]}</td>
                    </tr>
                ))}
            </table>
            { leaderboard?.self &&
                <div className="self">
                    <p>{t("leaderboard-page.rank")}: {leaderboard?.self}</p>
                </div>
            }
        </div>
    )
}
export default Leaderboard