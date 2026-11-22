package dev.hackerslash.pulse;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

final class TestServer implements AutoCloseable {

    final HttpServer server;
    volatile int status = 200;
    volatile String json;
    volatile String authorization;
    final List<String> received = new CopyOnWriteArrayList<>();

    TestServer() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/", ex -> {
            if (ex.getRequestMethod().equals("POST")) {
                received.add(new String(ex.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            }
            if (ex.getRequestURI().getPath().equals("/slow")) {
                try { Thread.sleep(2000); } catch (InterruptedException ignored) {}
            }
            authorization = ex.getRequestHeaders().getFirst("Authorization");
            if (json != null) {
                byte[] b = json.getBytes(StandardCharsets.UTF_8);
                ex.getResponseHeaders().set("Content-Type", "application/json");
                ex.sendResponseHeaders(status, b.length);
                ex.getResponseBody().write(b);
            } else {
                ex.sendResponseHeaders(status, -1);
            }
            ex.close();
        });
        server.start();
    }

    String url(String path) {
        return "http://127.0.0.1:" + server.getAddress().getPort() + path;
    }

    @Override
    public void close() {
        server.stop(0);
    }
}
