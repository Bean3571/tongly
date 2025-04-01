package repositories

import (
	"context"
	"database/sql"
	"tongly-backend/internal/entities"
)

// LanguageRepository handles database operations for languages
type LanguageRepository struct {
	db *sql.DB
}

// NewLanguageRepository creates a new LanguageRepository
func NewLanguageRepository(db *sql.DB) *LanguageRepository {
	return &LanguageRepository{
		db: db,
	}
}

// GetAllLanguages retrieves all languages
func (r *LanguageRepository) GetAllLanguages(ctx context.Context) ([]entities.Language, error) {
	query := `
		SELECT id, name, created_at
		FROM languages
		ORDER BY name
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var languages []entities.Language
	for rows.Next() {
		var language entities.Language
		err := rows.Scan(
			&language.ID,
			&language.Name,
			&language.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		languages = append(languages, language)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return languages, nil
}

// GetAllProficiencies retrieves all language proficiency levels
func (r *LanguageRepository) GetAllProficiencies(ctx context.Context) ([]entities.LanguageProficiency, error) {
	query := `
		SELECT id, name, created_at
		FROM language_proficiency
		ORDER BY id
	`

	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var proficiencies []entities.LanguageProficiency
	for rows.Next() {
		var proficiency entities.LanguageProficiency
		err := rows.Scan(
			&proficiency.ID,
			&proficiency.Name,
			&proficiency.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		proficiencies = append(proficiencies, proficiency)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return proficiencies, nil
}

// GetLanguageByID retrieves a language by ID
func (r *LanguageRepository) GetLanguageByID(ctx context.Context, id int) (*entities.Language, error) {
	query := `
		SELECT id, name, created_at
		FROM languages
		WHERE id = $1
	`

	var language entities.Language
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&language.ID,
		&language.Name,
		&language.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &language, nil
}

// GetProficiencyByID retrieves a proficiency level by ID
func (r *LanguageRepository) GetProficiencyByID(ctx context.Context, id int) (*entities.LanguageProficiency, error) {
	query := `
		SELECT id, name, created_at
		FROM language_proficiency
		WHERE id = $1
	`

	var proficiency entities.LanguageProficiency
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&proficiency.ID,
		&proficiency.Name,
		&proficiency.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &proficiency, nil
}
