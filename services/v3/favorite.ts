import { Service } from "typedi";
import { FileRepository } from "../../schemas/redis/file";
import { EntityId } from "redis-om";
import { IFavoriteAdd, IFavoriteGet, IFavoriteGetForAuction, IFavoriteRemove } from "../../models/favorite";
import { FavoriteRepository } from "../../schemas/redis/favorite";
import { LotRepository } from "../../schemas/redis/lot";
import moment from "moment-timezone";

@Service()
export class FavoriteService3 {
  public async addFavorite(favorite: IFavoriteAdd) {
    // first check if the favorite already exists
    const existingFavorite = await FavoriteRepository.search() //
      .where("lot_entity_id")
      .eq(favorite.lot_entity_id)
      .where("user_entity_id")
      .eq(favorite.user_entity_id)
      .return.first();

    if (existingFavorite) {
      throw new Error("You have already favorited this lot!");
    }

    const objToSave: IFavoriteAdd = {
      ...favorite,
      created_at: moment().tz("Africa/Johannesburg").unix(),
    };

    const savedFavorite = await FavoriteRepository.save(objToSave);

    const lot = await LotRepository.fetch(savedFavorite.lot_entity_id.toString());

    return {
      entity_id: lot[EntityId as any],
      ...lot,
    };
  }

  public async removeFavorite(favorite: IFavoriteRemove) {
    // first check if the favorite already exists
    const existingFavorite = await FavoriteRepository.search() //
      .where("lot_entity_id")
      .eq(favorite.lot_entity_id)
      .where("user_entity_id")
      .eq(favorite.user_entity_id)
      .return.first();

    if (!existingFavorite) {
      throw new Error("You have not favorited this lot in order to be able to remove it from your favorites!");
    }

    await FavoriteRepository.remove(existingFavorite[EntityId as any]);

    const lot = await LotRepository.fetch(existingFavorite.lot_entity_id.toString());

    return lot[EntityId as any]; // return the entity_id of the removed lot
  }

  public async getFavorite(favorite: IFavoriteGet) {
    const existingFavorite = await FavoriteRepository.search() //
      .where("lot_entity_id")
      .eq(favorite.lot_entity_id)
      .and("user_entity_id")
      .eq(favorite.user_entity_id)
      .return.first();

    if (!existingFavorite) {
      throw new Error("Could not find favorited lot for this user!");
    }

    const lot = await LotRepository.fetch(existingFavorite.lot_entity_id.toString());

    const objToReturn = {
      ...lot,
      entity_id: lot[EntityId as any],
      images: await FileRepository.search() //
        .where("lot_entity_id")
        .eq(existingFavorite.lot_entity_id.toString())
        .and("type")
        .eq("Image")
        .return.all(),
    };

    return objToReturn;
  }

  public async getFavoritesforAuction(favorite: IFavoriteGetForAuction) {
    const foundFavorites = await FavoriteRepository.search() //
      .where("user_entity_id")
      .eq(favorite.user_entity_id)
      .and("auction_entity_id")
      .eq(favorite.auction_entity_id)
      .return.all();

    const favorites = [];

    for (const favorite of foundFavorites) {
      const lot = await LotRepository.fetch(favorite.lot_entity_id.toString());
      if (!lot.auction_entity_id) {
        continue;
      }

      const firstImage = await FileRepository.search() //
        .where("lot_entity_id")
        .eq(favorite.lot_entity_id.toString())
        .return.first();

      const objToReturn = {
        ...lot,
        entity_id: lot[EntityId as any],
        images: firstImage ? [firstImage] : [], // array format for consistency
      };

      favorites.push(objToReturn);
    }

    // sort favorites by lot_number asc
    favorites.sort((a, b) => {
      return a.lot_number - b.lot_number;
    });

    return favorites;
  }
}
