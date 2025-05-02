import { Entity } from "redis-om";

export interface IFavorite extends Entity {
  user_entity_id: string;
}

export interface IFavoriteAdd extends IFavorite {
  auction_entity_id: string;
  lot_entity_id: string;
}

export interface IFavoriteRemove extends IFavorite {
  lot_entity_id: string;
}

export interface IFavoriteGet extends IFavorite {
  lot_entity_id: string;
}

export interface IFavoriteGetForAuction extends IFavorite {
  auction_entity_id: string;
}
