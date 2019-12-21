import { BigInt, Bytes, ByteArray, crypto } from "@graphprotocol/graph-ts"
import { Contract, LimitOrderUpdated } from "../generated/Contract/Contract"
import { LimitOrder } from "../generated/schema"

function hashOfLimitOrder(
  makerAddress: Bytes,
  takerAddress: Bytes,
  makerAsset: Bytes,
  takerAsset: Bytes,
  makerAmount: BigInt,
  takerAmount: BigInt,
  expiration: BigInt,
  remainingAmount: BigInt
): ByteArray {
  return crypto.keccak256(
    ByteArray.fromHexString(
      makerAddress.toHex().substr(2) +
      takerAddress.toHex().substr(2) +
      makerAsset.toHex().substr(2) +
      takerAsset.toHex().substr(2) +
      makerAmount.toHex().substr(2) +
      takerAmount.toHex().substr(2) +
      expiration.toHex().substr(2) +
      remainingAmount.toHex().substr(2)
    )
  );
}

export function handleLimitOrderUpdated(event: LimitOrderUpdated): void {
  let entity_id = hashOfLimitOrder(
    event.params.makerAddress,
    event.params.takerAddress,
    event.params.makerAsset,
    event.params.takerAsset,
    event.params.makerAmount,
    event.params.takerAmount,
    event.params.expiration,
    event.params.remaining,
  ).toHex();

  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = LimitOrder.load(entity_id);

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (entity == null) {
    entity = new LimitOrder(entity_id)

    // Entity fields can be set using simple assignments
    entity.updatesCount = BigInt.fromI32(0)

    // Entity fields can be set based on event parameters
    entity.makerAddress = event.params.makerAddress
    entity.takerAddress = event.params.takerAddress
    entity.makerAsset = event.params.makerAsset
    entity.takerAsset = event.params.takerAsset
    entity.makerAmount = event.params.makerAmount
    entity.takerAmount = event.params.takerAmount
    entity.expiration = event.params.expiration
  }

  // BigInt and BigDecimal math are supported
  entity.updatesCount = entity.updatesCount + BigInt.fromI32(1)

  entity.remainingAmount = event.params.remaining

  // Entities can be written to the store with `.save()`
  entity.save()

  // Note: If a handler doesn't require existing field values, it is faster
  // _not_ to load the entity from the store. Instead, create it fresh with
  // `new Entity(...)`, set the fields that should be updated and save the
  // entity back to the store. Fields that were not set or unset remain
  // unchanged, allowing for partial updates to be applied.

  // It is also possible to access smart contracts from mappings. For
  // example, the contract that has emitted the event can be connected to
  // with:
  //
  // let contract = Contract.bind(event.address)
  //
  // The following functions can then be called on this contract to access
  // state variables and other data:
  //
  // - contract.available(...)
  // - contract.balanceOf(...)
  // - contract.remainings(...)
}
