<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
</script>

<main id="main">
	<section class="hero" id="top">
		<div class="hero-inner">
			<div class="hero-copy">
				<p class="eyebrow">{m.hero_eyebrow()}</p>
				<h1>{m.hero_title()}</h1>
				<p class="lead">{m.hero_description()}</p>
				<div class="actions">
					<a class="button primary" href="https://app.teknologappen.se">{m.login_app()}</a>
					<a class="button secondary" href="https://admin.teknologappen.se">
						{m.login_admin()}
					</a>
				</div>
			</div>

			<div class="app-preview" aria-hidden="true">
				<div class="preview-glow"></div>
				<div class="phone-card">
					<div class="phone-topline"><span></span><span></span></div>
					<p class="preview-kicker">{m.preview_today()}</p>
					<div class="activity-preview peach">
						<div class="preview-date">14</div>
						<div>
							<strong>{m.preview_activity_one()}</strong>
							<span>{m.preview_activity_one_meta()}</span>
						</div>
					</div>
					<div class="activity-preview green">
						<div class="preview-date">18</div>
						<div>
							<strong>{m.preview_activity_two()}</strong>
							<span>{m.preview_activity_two_meta()}</span>
						</div>
					</div>
					<div class="ticket-preview">
						<div>
							<span>{m.preview_ticket()}</span>
							<strong>{m.preview_ticket_status()}</strong>
						</div>
						<div class="ticket-code"></div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section class="about section" id="about">
		<div class="section-inner">
			<div class="section-heading">
				<p class="eyebrow">{m.about_eyebrow()}</p>
				<h2>{m.about_title()}</h2>
				<p>{m.about_description()}</p>
			</div>
			<div class="feature-grid">
				<article>
					<span class="feature-number">01</span>
					<h3>{m.feature_discover_title()}</h3>
					<p>{m.feature_discover_description()}</p>
				</article>
				<article>
					<span class="feature-number">02</span>
					<h3>{m.feature_tickets_title()}</h3>
					<p>{m.feature_tickets_description()}</p>
				</article>
				<article>
					<span class="feature-number">03</span>
					<h3>{m.feature_community_title()}</h3>
					<p>{m.feature_community_description()}</p>
				</article>
			</div>
		</div>
	</section>

	<section class="legal section" id="legal">
		<div class="section-inner legal-inner">
			<div class="section-heading legal-heading">
				<p class="eyebrow">{m.legal_eyebrow()}</p>
				<h2>{m.legal_title()}</h2>
				<p>{m.legal_intro()}</p>
			</div>

			<div class="legal-grid">
				<article class="legal-card withdrawal-card">
					<h3>{m.withdrawal_title()}</h3>
					<p>{m.withdrawal_description()}</p>
					<a href="https://lagen.nu/2005:59#K2R11" target="_blank" rel="noopener noreferrer">
						{m.withdrawal_law_link()} <span aria-hidden="true">↗</span>
					</a>
					<p class="complaints">{m.complaints_description()}</p>
				</article>

				<article class="legal-card company-card">
					<h3>{m.company_title()}</h3>
					<strong>E-sektionen inom TLTH</strong>
					<p>{m.organisation_number()}: 845001-2284</p>
					<address>
						Edekvata, plan B i E-huset, LTH<br />
						Ole Römers väg 3B<br />
						223 63 Lund
					</address>
				</article>

				<article class="legal-card compact-card">
					<h3>{m.payment_title()}</h3>
					<p>{m.swish_number()}</p>
					<strong class="detail-value">1234207205</strong>
				</article>

				<article class="legal-card compact-card">
					<h3>{m.contact_title()}</h3>
					<p>{m.contact_description()}</p>
					<a class="detail-value" href="mailto:info@esek.se">info@esek.se</a>
				</article>

				<article class="legal-card vat-card">
					<h3>{m.vat_title()}</h3>
					<p>{m.vat_description()}</p>
				</article>
			</div>
		</div>
	</section>
</main>
