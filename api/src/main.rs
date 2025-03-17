mod handlers;
mod routes;
mod utils;

use std::net::SocketAddr;
use routes::create_router;

#[tokio::main]
async fn main() {
    let app = create_router();

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Server running on http://{}", addr);

    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
