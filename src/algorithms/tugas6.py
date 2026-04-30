from collections import deque
import networkx as nx

class Tugas6:
    def __init__(self, u_nodes=None, v_nodes=None, adj_list=None, dataset_edges=None):
        self.U = list(u_nodes) if u_nodes else []
        self.V = list(v_nodes) if v_nodes else []
        self.adj = adj_list if adj_list else {}
        
        self.dataset_edges = dataset_edges if dataset_edges else []
        
        self.pasangan_U = {u: None for u in self.U}
        self.pasangan_V = {v: None for v in self.V}
        self.dist = {}

    def bfs(self):
        queue = deque()
        for u in self.U:
            if self.pasangan_U[u] is None:
                self.dist[u] = 0
                queue.append(u)
            else:
                self.dist[u] = float('inf')
        self.dist[None] = float('inf')
        
        while queue:
            u = queue.popleft()
            if self.dist[u] < self.dist[None]:
                for v in self.adj.get(u, []):
                    p_sekarang = self.pasangan_V[v]
                    if self.dist.get(p_sekarang, float('inf')) == float('inf'):
                        self.dist[p_sekarang] = self.dist[u] + 1
                        queue.append(p_sekarang)
        return self.dist[None] != float('inf')

    def dfs(self, u):
        if u is not None:
            for v in self.adj.get(u, []):
                p_sekarang = self.pasangan_V[v]
                if self.dist.get(p_sekarang, float('inf')) == self.dist[u] + 1:
                    if self.dfs(p_sekarang):
                        self.pasangan_V[v] = u
                        self.pasangan_U[u] = v
                        return True
            self.dist[u] = float('inf')
            return False
        return True

    def search_max_matching(self):
        match_count = 0
        while self.bfs():
            for u in self.U:
                if self.pasangan_U[u] is None:
                    if self.dfs(u):
                        match_count += 1
        return match_count, self.pasangan_U

    def search_coloring_timetabling(self):
        G_konflik = nx.Graph()
        for idx, (u1, v1) in enumerate(self.dataset_edges):
            G_konflik.add_node((u1, v1, idx))
            for jdx, (u2, v2) in enumerate(self.dataset_edges):
                if idx < jdx:
                    if u1 == u2 or v1 == v2:
                        G_konflik.add_edge((u1, v1, idx), (u2, v2, jdx))
        
        coloring = nx.coloring.greedy_color(G_konflik, strategy="largest_first")
        num_sessions = max(coloring.values()) + 1
        
        result_dict = {}
        for (u, v, _), session_id in coloring.items():
            session_name = f"Sesi {session_id + 1}"
            if session_name not in result_dict:
                result_dict[session_name] = []
            result_dict[session_name].append({u: v})
            
        return num_sessions, result_dict

if __name__ == "__main__":
    bipartite = [
        ("A", "1"), ("A", "3"), ("A", "5"),
        ("B", "2"), ("B", "3"),
        ("C", "1"), ("C", "4"),
        ("D", "4"), ("D", "5"), ("D", "6"),
        ("E", "2"), ("E", "7"),
        ("F", "7"), ("F", "8"),
        ("G", "6"), ("G", "9"),
        ("H", "8"), ("H", "10"),
        ("I", "9"), ("I", "10"),
        ("J", "5"), ("J", "10")
    ]

    U_nodes = set()
    V_nodes = set()
    graf_adj = {}

    for u, v in bipartite:
        U_nodes.add(u)
        V_nodes.add(v)
        if u not in graf_adj:
            graf_adj[u] = []
        graf_adj[u].append(v)

    hk = Tugas6(U_nodes, V_nodes, graf_adj)
    total_match, dict_max_matching = hk.search_max_matching()

    if total_match == len(U_nodes):
        print("PERFECT MATCHING")
    else:
        print("MAXIMUM MATCHING")

    print("\nHASIL MAXIMUM MATCHING")
    print(dict_max_matching)

    general = [("A", "1"), ("A", "1"), ("B", "2"), ("C", "2")]
    
    tugas_general = Tugas6(dataset_edges= general)
    total_s, dict_s = tugas_general.search_coloring_timetabling()
    
    print("\nHASIL TIMETABLING")
    print(f"Total Sesi: {total_s}")
    print(dict_s)