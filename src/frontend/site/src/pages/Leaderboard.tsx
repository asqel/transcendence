import { useEffect, useState } from "react";
import { globalApi, type LeaderboardResponse} from "../api";
import "./Leaderboard.css"

function Leaderboard() {
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
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Elo</th>
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
                    <p>Rank: {leaderboard?.self}</p>
                </div>
            }
        </div>
    )
}
export default Leaderboard