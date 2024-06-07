import pygame, random, math

pygame.init()

screen = pygame.display.set_mode((800,800))
display = pygame.Surface((200,200))

#start = [random.randint(0,199),  random.randint(0,199)]
#dest = [random.randint(0,199),  random.randint(0,199)]
start = [4,  70]
dest = [150, 150]
display.set_at(start, [255,0,0])
display.set_at(dest, [0,255,0])

std = 2

#OLD SHIT I DONT FUCK WITH ANYMORE

# for i in range(1000):
#     if math.hypot(dest[1]-start[1], dest[0]-start[0]) < 1: break
#     angle_dest = math.atan2(dest[1]-start[1], dest[0]-start[0])

#     u1 = random.uniform(0,1)
#     u2 = random.uniform(0,1)
#     z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)

#     angle_approach = angle_dest + z * std

#     move = [math.cos(angle_approach) * step, math.sin(angle_approach) * step]

#     start[0] += move[0]
#     start[1] += move[1]
#     display.set_at([math.floor(start[0]), math.floor(start[1])], [255,255,0])


# NEW HSIT
pygame.draw.circle(display, [0,0,255], [100, 100], 50)

give_up = 0
while (start[0] != dest[0] or start[1] != dest[1]) and give_up < 1000:
    moves = [[math.sqrt(2)/2, 1, math.sqrt(2)/2], [1, 0, 1], [math.sqrt(2)/2, 1, math.sqrt(2)/2]]

    angle_dest = -math.atan2(dest[1]-start[1], dest[0]-start[0]) + math.pi

    print(angle_dest)

    f = lambda theta : 1/(std * math.sqrt(2 * math.pi)) * math.pow(math.e, -0.5 * math.pow((theta - angle_dest)/std,2))

    moves[1][2] *= f(0*math.pi/4)
    moves[0][2] *= f(7*math.pi/4)
    moves[0][1] *= f(6*math.pi/4)
    moves[0][0] *= f(5*math.pi/4)
    moves[1][0] *= f(4*math.pi/4)
    moves[2][0] *= f(3*math.pi/4)
    moves[2][1] *= f(2*math.pi/4)
    moves[2][2] *= f(1*math.pi/4)

    for i in range(3):
        for j in range(3):
            if math.hypot(start[0]+i-101,start[1]-j-1-100) < 50: moves[i][j] *= 0

    [move] = random.choices([0, 1, 2, 3, 4, 5, 6, 7], [moves[1][2], moves[0][2], moves[0][1], moves[0][0], moves[1][0], moves[2][0], moves[2][1], moves[2][2]])

    print(move)
    if move == 0:
        start[0] -= 1
    elif move == 1:
        start[0] -= 1
        start[1] -= 1
    elif move == 2:
        start[1] -= 1
    elif move == 3:
        start[0] += 1
        start[1] -= 1
    elif move == 4:
        start[0] += 1
    elif move == 5:
        start[0] += 1
        start[1] += 1
    elif move == 6:
        start[1] += 1
    elif move == 7:
        start[0] -= 1
        start[1] += 1

    display.set_at([start[0], start[1]], [255,255,0])

    give_up += 1

while True:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            pygame.quit()
    screen.blit(pygame.transform.scale(display, (800,800)), (0,0))
    pygame.display.update()

