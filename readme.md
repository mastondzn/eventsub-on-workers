# Twitch EventSub on Cloudflare Workers

This is a example repository of how to use Cloudflare Workers to receive Twitch EventSub events. Uses [hono](https://github.com/honojs/hono) as the router.

Notable file is [src/routes/eventsub.ts](src/routes/eventsub.ts), the route that receives and verifies EventSub events.

To test events you need a internet-exposed public URL, so you could publish on every change or alternatively you can use Twitch's CLI to test locally. I like using Cloudflare Tunnels to test locally though. You can use [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation) to create a tunnel. If you want a constant url [you can setup a remotely managed tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-remote-tunnel/) (you need a domain added to cloudflare for this).
