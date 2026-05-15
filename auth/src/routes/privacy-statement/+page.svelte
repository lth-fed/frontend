<script lang="ts">
	import { i18n } from 'common-lib'
</script>

{#if i18n.getLang() !== 'sv'}
	<p>This page is only available in English at the moment. Sorry!</p>
{/if}

<h1>
	Överföring av personuppgifter till Teknologappen och sektionsinlogg för medlemmar i TLTH i
	samband med federerad inloggning (Privacy Policy)
</h1>
<h2>Beskrivning av Teknologappen och sektionsinlogg för medlemmar i TLTH</h2>

<p>
	Teknologappen och sektionsinlogg för medlemmar i TLTH är en tjänst riktad till medlemmar i TLTH
	och övriga studenter aktiva i studentlivet på LTH.
</p>
<p>
	Denna tjänsten finns för att kunnat logga in på teknologappen och våra sektionshemsidor säkert
	och att kunna verifiera tillhörighet till både LTH och TLTH används LU-inlogg, vilket garanterar
	ens användarnamn som kan kopplas till medlemskap.
</p>
<p>
	Teknologappen och sektionshemsidorna verkar för ett förbättrat studentliv enligt TLTHs
	styrdokument och drivs exklusivt av ideella föreningar.
</p>

<h2>Hantering av personuppgifter</h2>
<h3>Överföring av personuppgifter</h3>

<p>
	Personuppgifter överförs från identitetsutfärdaren (din inloggningstjänst) till tjänsten för att
	säkerställa att du som användare får tillgång till din information i tjänsten samt för att ge
	dig ett användaranpassat gränssnitt.
</p>

<p>
	I samband med inloggning i denna tjänst begärs följande personuppgifter från den
	identitetsutfärdare du använder:
</p>
<table>
	<thead>
		<tr>
			<th>Personuppgifter</th>
			<th>Syfte</th>
			<th>Teknisk representation</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<th>Unik identifierare (känt för studenter som StilID, t.ex. aa0000bb-s)</th>
			<th>Att ge dig tillgång till tjänsten och din information och ditt medlemskap</th>
			<th>samlSubjectID</th>
		</tr>
		<tr>
			<th>Namn</th>
			<th
				>Namnet används för att kolla legitimation vid alkoholevent och för att visa vem du
				är för andra användare</th>
			<th>displayName</th>
		</tr>
		<tr>
			<th>E-postadress</th>
			<th>Används för att kunna kontakta dig, även av andra användare</th>
			<th>mail</th>
		</tr>
	</tbody>
</table>

<p>
	Förutom direkta personuppgifter överförs även indirekta personuppgifter såsom vilken
	organisation användaren tillhör och vilken identitetsutfärdare som har använts vid inloggningen.
	I kombination med ovanstående personuppgifter kan dessa användas för att unikt identifiera en
	person.
</p>

<h3>Övrig behandling av personuppgifter i tjänsten</h3>

<p>
	I tjänsten kommer du kunna ställa in språk som används för att skicka ut notifikationer med rätt
	språk. Ditt personnummer kan kunna komma att förfrågas för att verifiera ditt medlemskap i
	kåren. Personnummret sparas aldrig. Uppgifter om medlemskap i TLTH hämtas från kåren och kopplas
	till kontot.
</p>

<h3>Överföring av personuppgifter till tredje part</h3>

<p>
	Inga uppgifter överförs till tredjepart. Sektionshemsidorna är under TLTH och E, D, och
	F-sektionen och är därför inte tredjepart.
</p>

<h3>Rättslig grund</h3>

<p>
	Sektionerna behöver ditt namn för att kunna sälja biljetter till dig. Den unika identifieraren
	krävs för att få tillgång till kontot där du kan köpa biljetter, då namnet är krypterat.
	E-postadressen krävs för att kunna kontakta dig vid problem med biljetter. Genom att använda
	tjänsten ger du samtycke till detta.
</p>

<h3>Rätt till registerutdrag, rättelse och radering av personuppgifter</h3>

<p>
	För registerutdrag, rättelse och radering av dina personuppgifter, kontakta
	personuppgiftsansvarig.
</p>

<p>
	Rättelse av personuppgifter som överförts i samband med inloggning gör du i den
	identitetsutfärdare som du använder för att logga in. Dessa uppgifter rättas i tjänsten vid
	första inloggningen efter att personuppgifterna är rättade i identitetsutfärdaren.
</p>

<h3>Rensning av personuppgifter</h3>

<p>
	Vid inaktivitet rensas personuppgifter helt efter två år. Du har då inte längre tillgång till
	innehållet du tidigare hade.
</p>

<h2>Personuppgiftsansvarig</h2>

<p>
	Personuppgiftsansvarig för behandlingen av personuppgifter är Utvecklarna bakom Teknologappen,
	Sverige. Har du frågor om hur personuppgifter hanteras inom tjänsten tag kontakt med
	informationschef@esek.se.
</p>

<p>Dataskyddsombud är Informationschef, E-sektionen, informationschef@esek.se.</p>
<h2>GÉANT Data Protection Code of Conduct</h2>

<p>
	Denna tjänst följer det internationella ramverket <a
		href="http://www.geant.net/uri/dataprotection-code-of-conduct/v1"
		>GÉANT Data Protection Code of Conduct
		(http://www.geant.net/uri/dataprotection-code-of-conduct/v1)</a> för överföring av personuppgifter
	från identitetsutfärdare till tjänsten. Ramverket är avsett för tjänster i Sverige, EU och EES som
	används inom forskning och högre utbildning.
</p>
