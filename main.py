from src.graph import UndirectedGraph


def main():
    g = UndirectedGraph()

    g.add_edge("A", "B")
    g.add_edge("A", "C")
    g.add_edge("B", "D")
    g.add_edge("C", "D")
    g.add_edge("D", "E")

    print("Daftar Ketetanggaan (Adjacency List) Graph:")
    print(g)

    print(g.bfs("A"))
    print(g.dfs("A"))


if __name__ == "__main__":
    main()
