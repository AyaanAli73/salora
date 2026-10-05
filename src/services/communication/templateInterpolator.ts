/**
 * Provider-Agnostic Message Template Variable Interpolator.
 * Safely substitutes dynamic variables (e.g. {{customer_name}}, {{service_name}})
 * with provided context values, leaving unknown tokens intact or gracefully falling back.
 */

export interface TemplateContext {
  customer_name?: string
  service_name?: string
  appointment_date?: string
  appointment_time?: string
  staff_name?: string
  invoice_number?: string
  amount?: string | number
  salon_name?: string
  review_link?: string
  offer_details?: string
  membership_name?: string
  expiry_date?: string
  loyalty_points?: string | number
  [key: string]: string | number | undefined
}

export function interpolateTemplate(
  templateText: string,
  context: TemplateContext = {}
): string {
  if (!templateText) return ''

  return templateText.replace(/{{\s*([a-zA-Z0-9_-]+)\s*}}/g, (match, variableName) => {
    const value = context[variableName]
    if (value !== undefined && value !== null) {
      return String(value)
    }
    // Return original placeholder if no value provided
    return match
  })
}

export function extractTemplateVariables(templateText: string): string[] {
  if (!templateText) return []
  const matches = templateText.match(/{{\s*([a-zA-Z0-9_-]+)\s*}}/g)
  if (!matches) return []
  const unique = Array.from(new Set(matches))
  return unique
}
