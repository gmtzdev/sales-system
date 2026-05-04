export interface SaleTicket {
    id?: number
    folio?: number
    box_id: number
    cashier_id: number
    name: string
    subtotal?: number
    taxes?: number
    total?: number
    profit?: number
    is_open?: boolean
    client_id?: number
    saled_at?: Date
    is_modifiable?: boolean
    pay_by?: number
    currency?: string
    article_count?: number
    pay_at?: Date
    is_cancelled?: boolean
    operation_id: number
    old_ticket_id?: number
    notes?: string
    print_note?: string
    pay_method?: string
    reference?: string
    invoice_id?: number
    total_refund?: number
}