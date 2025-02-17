package common

import "context"

// PaginationParams represents common pagination parameters
type PaginationParams struct {
	Page     int
	PageSize int
}

// FilterParams represents common filtering parameters
type FilterParams struct {
	StartDate string
	EndDate   string
	Status    string
	SortBy    string
	SortOrder string
}

// Repository represents the base repository interface
type Repository[T any] interface {
	Create(ctx context.Context, entity *T) error
	GetByID(ctx context.Context, id int) (*T, error)
	Update(ctx context.Context, entity *T) error
	Delete(ctx context.Context, id int) error
	List(ctx context.Context, pagination PaginationParams, filter FilterParams) ([]T, error)
}

// UseCase represents the base usecase interface
type UseCase[T any] interface {
	Create(ctx context.Context, dto *T) error
	Get(ctx context.Context, id int) (*T, error)
	Update(ctx context.Context, dto *T) error
	Delete(ctx context.Context, id int) error
	List(ctx context.Context, pagination PaginationParams, filter FilterParams) ([]T, error)
}
