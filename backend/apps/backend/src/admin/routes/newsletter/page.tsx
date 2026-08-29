import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Envelope } from "@medusajs/icons"
import { Container, Heading, Table, Text } from "@medusajs/ui"
import { useEffect, useState } from "react"

type Subscriber = {
  id: string
  email: string
  created_at: string
}

const NewsletterPage = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch("/admin/newsletter", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Request failed")
        return res.json()
      })
      .then((data) => setSubscribers(data.subscribers || []))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h1">Newsletter Subscribers</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          {subscribers.length} subscriber{subscribers.length === 1 ? "" : "s"}
        </Text>
      </div>
      {loading ? (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-subtle">Loading…</Text>
        </div>
      ) : error ? (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-subtle">Could not load subscribers.</Text>
        </div>
      ) : subscribers.length === 0 ? (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-subtle">No one has signed up yet.</Text>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Email</Table.HeaderCell>
              <Table.HeaderCell>Signed up</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {subscribers.map((s) => (
              <Table.Row key={s.id}>
                <Table.Cell>{s.email}</Table.Cell>
                <Table.Cell>
                  {new Date(s.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Newsletter",
  icon: Envelope,
})

export default NewsletterPage
