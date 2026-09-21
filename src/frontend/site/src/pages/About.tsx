import { Link } from 'react-router-dom'
import './About.css'

function About() {
	return (
		<div>
			<h1>À propos</h1>
			<h1>À propos</h1>

      <p>
	    Bienvenue sur notre plateforme de Puissance 4 en ligne.
      </p>

      <p>
	    Ce site permet de jouer au Puissance 4 directement en ligne contre d'autres joueurs.
	    Vous pouvez affronter vos amis ou rencontrer d'autres joueurs, suivre vos parties
	    et profiter d'une expérience de jeu directement depuis le site.
      </p>

      <p>
	    La plateforme propose également un système d'amis ainsi qu'un chat permettant
	    de communiquer avec les autres joueurs.
      </p>

      <Link to="/privacy-policy" className="privacy-link">
	    Privacy Policy
      </Link>


			<Link to="/privacy-policy" className="privacy-link">
				Privacy Policy
			</Link>
		</div>
	)
}

export default About