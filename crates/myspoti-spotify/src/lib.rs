//! Spotify client engine, authentication, GraphQL queries, and ad-blocking.

pub mod adblock;
pub mod auth;
pub mod gql;
pub mod spclient;

pub use adblock::AdBlock;
pub use auth::SpotifyAuthManager;
pub use gql::GqlClient;
pub use spclient::Spclient;

