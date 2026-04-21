export function listPetsByUserId(db, userId) {
  return db
    .prepare(
      `
        SELECT *
        FROM pets
        WHERE user_id = ?
        ORDER BY created_at DESC, id DESC
      `
    )
    .all(userId)
}

export function findPetById(db, userId, petId) {
  return db
    .prepare(
      `
        SELECT *
        FROM pets
        WHERE user_id = ? AND id = ?
        LIMIT 1
      `
    )
    .get(userId, petId)
}

export function createPet(db, pet) {
  db.prepare(
    `
      INSERT INTO pets (
        id,
        user_id,
        name,
        type,
        breed,
        gender,
        birthday,
        weight,
        neutered,
        allergies_json,
        preferences_json,
        avatar_url,
        color,
        created_at,
        updated_at
      ) VALUES (
        @id,
        @user_id,
        @name,
        @type,
        @breed,
        @gender,
        @birthday,
        @weight,
        @neutered,
        @allergies_json,
        @preferences_json,
        @avatar_url,
        @color,
        @created_at,
        @updated_at
      )
    `
  ).run(pet)
}

export function updatePet(db, pet) {
  db.prepare(
    `
      UPDATE pets
      SET
        name = @name,
        type = @type,
        breed = @breed,
        gender = @gender,
        birthday = @birthday,
        weight = @weight,
        neutered = @neutered,
        allergies_json = @allergies_json,
        preferences_json = @preferences_json,
        avatar_url = @avatar_url,
        color = @color,
        updated_at = @updated_at
      WHERE id = @id AND user_id = @user_id
    `
  ).run(pet)
}

export function deletePet(db, userId, petId) {
  db.prepare('DELETE FROM pets WHERE user_id = ? AND id = ?').run(userId, petId)
}
