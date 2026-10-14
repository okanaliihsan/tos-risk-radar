/// <reference types="cypress" />
/**
 * ≤ 90 s demo: one happy path + one moment where the system is honest about
 * what it does not know (manipulated page -> lower confidence, rejected claim,
 * quarantined and hidden instructions, cloaked clause added back).
 */
const live = Boolean(Cypress.env('LLM_API_KEY'))
// empty baseURL/model -> the harness picks them from the key type (Gemini or OpenAI)
const llm = {
  baseURL: Cypress.env('LLM_BASE_URL') ?? (live ? '' : 'https://api.openai.com/v1'),
  model: Cypress.env('LLM_MODEL') ?? (live ? '' : 'stub'),
  apiKey: Cypress.env('LLM_API_KEY') ?? 'stub-key',
}
const llmTimeout = live ? 120_000 : 10_000

function openPage(file: string) {
  cy.visit(`/?page=${file}`, {
    onBeforeLoad(win) {
      ;(win as unknown as { __TOS_RADAR_LLM__: typeof llm }).__TOS_RADAR_LLM__ = llm
    },
  })
  cy.get('[data-cy=disclaimer]').should('be.visible').and('contain', 'Hukuki tavsiye değildir')
}

function stub(fixture: string) {
  if (!live) cy.intercept('POST', '**/chat/completions', { fixture, delay: 1200 }).as('llm')
}

function scrollPanel(selector: string) {
  cy.get(selector).first().scrollIntoView({ duration: 600, offset: { top: -20, left: 0 } })
}

describe('ToS Risk Radar demo', () => {
  it('happy path, then a manipulated page where the system shows its uncertainty', () => {
    // 1) Happy path: Turkish terms + subscription page
    stub('llm-bulutkutu.json')
    openPage('bulutkutu-kosullar.html')
    cy.wait(1500)
    cy.get('[data-cy=analyze]').click()
    cy.get('[data-cy=report]', { timeout: llmTimeout }).should('be.visible')
    cy.get('[data-cy=score-value]').invoke('text').should('match', /^\d+$/)
    cy.get('[data-cy=finding]').should('have.length.at.least', live ? 1 : 3)
    // every shown finding carries a verbatim quote that exists on the page
    cy.get('[data-cy=finding] [data-cy=quote]').each(($q) => {
      const quote = $q.text().replace(/^“|”$/g, '')
      cy.get('[data-cy=tab]').its('0.contentDocument.body.innerText').then((text) => {
        const norm = (s: string) => s.replace(/\s+/g, ' ').trim()
        expect(norm(text as string)).to.include(norm(quote))
      })
    })
    cy.wait(1500)
    scrollPanel('[data-cy=finding]:eq(2)')
    cy.wait(1500)
    scrollPanel('[data-cy=finding]:last')
    cy.wait(1000)
    cy.get('[data-cy=breakdown]').scrollIntoView({ duration: 400 }).find('summary').click()
    cy.wait(2000)

    // 2) Same terms, manipulated page: hidden instructions + a clause hidden from AI agents
    stub('llm-bulutkutu-injection.json')
    cy.get('[data-cy=page-select]').select('bulutkutu-kosullar-injection.html')
    cy.wait(1500)
    cy.get('[data-cy=analyze]').click()
    cy.get('[data-cy=report]', { timeout: llmTimeout }).should('be.visible')
    cy.get('[data-cy=report]').should('not.have.attr', 'data-confidence', 'high')
    cy.get('[data-cy=confidence]').scrollIntoView({ duration: 400 }).should('be.visible')
    cy.wait(2500)
    cy.get('[data-cy=security]').scrollIntoView({ duration: 600 }).should('contain', 'karantinada').and('contain', 'Gizli metin')
    cy.wait(3000)
    // the arbitration clause the page tried to hide from AI is still analysed
    if (!live) cy.get('[data-cy=finding][data-category=arbitration]').should('exist').scrollIntoView({ duration: 600 })
    else cy.get('[data-cy=report]').then(($r) => {
      // a real model may or may not flag it; show it when it does, never fail the demo on it
      const el = $r.find('[data-cy=finding][data-category=arbitration]')[0]
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    cy.wait(2000)
    if (!live) {
      // stub mode: the fabricated (paraphrased) claim is rejected, not shown as a finding
      cy.get('[data-cy=rejected]').scrollIntoView({ duration: 400 }).find('summary').click()
      cy.get('[data-cy=rejected]').should('contain', 'Alıntı sayfada birebir bulunamadı')
      cy.get('[data-cy=uncertain]').find('summary').click()
    } else {
      cy.get('body').then(($b) => {
        for (const cy_ of ['rejected', 'uncertain', 'possibly-missed']) {
          const el = $b.find(`[data-cy=${cy_}] summary`)
          if (el.length) el[0]!.click()
        }
      })
    }
    cy.wait(3000)
    cy.get('[data-cy=disclaimer]').first().scrollIntoView({ duration: 600 })
    cy.wait(1500)
  })
})
