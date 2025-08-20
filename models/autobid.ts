import { Entity } from "redis-om";

export interface ABid extends Entity {
    lot_entity_id: string;
    user_entity_id: string;
    term_and_condition?: string;
    status?: string;
    auction_id?: string;
    created_at?: Date | number;
    auction_entity_id: string;
    max_amount?: number;
    increment_amount?: number;
    updated_at?: Date | number;
}
